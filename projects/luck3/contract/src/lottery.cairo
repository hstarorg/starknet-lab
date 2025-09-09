use starknet::ContractAddress;
use starknet::storage::*;

#[starknet::interface]
pub trait IDailyLottery<TContractState> {
    fn buy_ticket(ref self: TContractState, guess: u8);
    fn claim_reward(ref self: TContractState, round_id: u64);
    fn get_current_round_info(self: @TContractState) -> (u64, u64, u256, u64);
    fn get_user_tickets(self: @TContractState, user: ContractAddress, round_id: u64) -> (u8, bool);
    fn get_user_reward(self: @TContractState, user: ContractAddress, round_id: u64) -> u256;
    fn get_round_winning_number(self: @TContractState, round_id: u64) -> u8;
    fn trigger_draw_if_expired(ref self: TContractState);
    fn draw_rounds_up_to(ref self: TContractState, target_round_id: u64);
    fn get_statistics(self: @TContractState) -> (u64, u64, u256);
    fn get_rounds_info(
        self: @TContractState, round_ids: Array<u64>,
    ) -> Array<(u64, u64, u256, u64, u8, bool)>;
}

#[starknet::contract]
mod DailyLottery {
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::*;
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};

    const ROUND_DURATION_SECONDS: u64 = 300; //  per round
    const TICKET_COST: u256 = 1000000000000000000; // 1 STRK = 10^18 wei
    const MIN_GUESS: u8 = 10;
    const MAX_GUESS: u8 = 99;

    #[storage]
    struct Storage {
        strk_token: ContractAddress,
        fee_address: ContractAddress,
        current_round_id: u64,
        rounds: Map<u64, Round>,
        user_tickets: Map<(u64, ContractAddress), u8>, // (round_id, user) -> guess
        user_is_winner: Map<(u64, ContractAddress), bool>, // (round_id, user) -> is_winner
        user_rewards: Map<(u64, ContractAddress), u256>, // (round_id, user) -> reward
        claimed_rewards: Map<(u64, ContractAddress), bool>, // (round_id, user) -> claimed
        total_tickets: Map<u64, u64>, // round_id -> total_tickets
        correct_guesses: Map<(u64, u8), u64>, // (round_id, guess) -> count
        participants: Map<(u64, u64), ContractAddress>, // (round_id, index) -> address
        participant_indices: Map<(u64, ContractAddress), u64>, // (round_id, address) -> index
        // Statistics
        total_participants: u64, // 总参与人数
        total_prize_pool: u256, // 总奖池金额
        unique_participants: Map<ContractAddress, bool> // 唯一参与者跟踪
    }

    #[derive(Drop, Serde, starknet::Store)]
    struct Round {
        id: u64,
        start_time: u64,
        end_time: u64,
        prize_pool: u256,
        winning_number: u8,
        is_drawn: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TicketBought: TicketBought,
        WinnerDrawn: WinnerDrawn,
        RewardClaimed: RewardClaimed,
        NewRoundStarted: NewRoundStarted,
    }

    #[derive(Drop, starknet::Event)]
    struct TicketBought {
        user: ContractAddress,
        round_id: u64,
        guess: u8,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct WinnerDrawn {
        round_id: u64,
        winning_number: u8,
        prize_pool: u256,
        winner_count: u64,
        reward_per_winner: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct RewardClaimed {
        user: ContractAddress,
        round_id: u64,
        amount: u256,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct NewRoundStarted {
        round_id: u64,
        start_time: u64,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, strk_token: ContractAddress, fee_address: ContractAddress,
    ) {
        self.strk_token.write(strk_token);
        self.fee_address.write(fee_address);
        self.current_round_id.write(1);

        let current_time = get_block_timestamp();
        let start_of_round = current_time - (current_time % ROUND_DURATION_SECONDS);
        let first_round = Round {
            id: 1,
            start_time: start_of_round,
            end_time: start_of_round + ROUND_DURATION_SECONDS,
            prize_pool: 0,
            winning_number: 0,
            is_drawn: false,
        };
        self.rounds.write(1, first_round);

        self
            .emit(
                NewRoundStarted {
                    round_id: 1, start_time: start_of_round, timestamp: current_time,
                },
            );
    }

    #[abi(embed_v0)]
    impl ILotteryImpl of super::IDailyLottery<ContractState> {
        fn buy_ticket(ref self: ContractState, guess: u8) {
            assert(guess >= MIN_GUESS && guess <= MAX_GUESS, 'Invalid guess range');

            let caller = get_caller_address();
            let current_time = get_block_timestamp();

            // Calculate current round ID dynamically
            let first_round = self.rounds.read(1);
            let first_round_start_time = first_round.start_time;
            let time_elapsed = current_time - first_round_start_time;
            let mut current_round_id = (time_elapsed / ROUND_DURATION_SECONDS) + 1;

            // Check for expired rounds before creating new round
            let mut check_round_id = 1;
            loop {
                let check_round = self.rounds.read(check_round_id);
                if check_round.id != check_round_id {
                    // Round doesn't exist, stop checking
                    break;
                }
                if !check_round.is_drawn && current_time >= check_round.end_time {
                    // Found expired round, draw it
                    let rollover = self.draw_winner(check_round_id);

                    // Create next round if needed
                    let next_round_id = check_round_id + 1;
                    let next_round = self.rounds.read(next_round_id);
                    if next_round.id != next_round_id {
                        let next_start_time = check_round.end_time;
                        let new_round = Round {
                            id: next_round_id,
                            start_time: next_start_time,
                            end_time: next_start_time + ROUND_DURATION_SECONDS,
                            prize_pool: rollover,
                            winning_number: 0,
                            is_drawn: false,
                        };
                        self.rounds.write(next_round_id, new_round);
                        self.current_round_id.write(next_round_id);

                        self
                            .emit(
                                NewRoundStarted {
                                    round_id: next_round_id,
                                    start_time: next_start_time,
                                    timestamp: current_time,
                                },
                            );
                    }
                }
                check_round_id += 1;
                if check_round_id > current_round_id {
                    break;
                }
            }

            // Recalculate current round ID after potential draws
            let time_elapsed_after = current_time - first_round_start_time;
            current_round_id = (time_elapsed_after / ROUND_DURATION_SECONDS) + 1;

            // Check if this round exists, if not create it
            let mut current_round = self.rounds.read(current_round_id);
            if current_round.id != current_round_id {
                // Round doesn't exist, create it
                let round_start_time = first_round_start_time
                    + (current_round_id - 1) * ROUND_DURATION_SECONDS;
                current_round =
                    Round {
                        id: current_round_id,
                        start_time: round_start_time,
                        end_time: round_start_time + ROUND_DURATION_SECONDS,
                        prize_pool: 0,
                        winning_number: 0,
                        is_drawn: false,
                    };
                self.rounds.write(current_round_id, current_round);
                self.current_round_id.write(current_round_id);

                self
                    .emit(
                        NewRoundStarted {
                            round_id: current_round_id,
                            start_time: round_start_time,
                            timestamp: current_time,
                        },
                    );
            }

            // Check if user already has ticket for this round (after potential round update)
            let existing_guess = self.user_tickets.read((current_round_id, caller));
            assert(existing_guess == 0, 'Already bought ticket');

            // Check if this is a new participant
            let is_new_participant = !self.unique_participants.read(caller);
            if is_new_participant {
                self.unique_participants.write(caller, true);
                let current_participants = self.total_participants.read();
                self.total_participants.write(current_participants + 1);
            }

            // Transfer STRK tokens for ticket purchase
            let strk_dispatcher = IERC20Dispatcher { contract_address: self.strk_token.read() };
            strk_dispatcher.transfer_from(caller, get_contract_address(), TICKET_COST);

            // Update total prize pool
            let current_total_prize = self.total_prize_pool.read();
            self.total_prize_pool.write(current_total_prize + TICKET_COST);

            // Record ticket and participant
            let ticket_index = self.total_tickets.read(current_round_id);
            self.user_tickets.write((current_round_id, caller), guess);
            self.participants.write((current_round_id, ticket_index), caller);
            self.participant_indices.write((current_round_id, caller), ticket_index);

            // Update round info - read fresh copy to avoid move issues
            let mut round_to_update = self.rounds.read(current_round_id);
            round_to_update.prize_pool += TICKET_COST;

            // Update ticket counts
            let total_tickets = self.total_tickets.read(current_round_id) + 1;
            self.total_tickets.write(current_round_id, total_tickets);

            // Update guess counts
            let guess_count = self.correct_guesses.read((current_round_id, guess)) + 1;
            self.correct_guesses.write((current_round_id, guess), guess_count);

            self.rounds.write(current_round_id, round_to_update);

            self
                .emit(
                    TicketBought {
                        user: caller, round_id: current_round_id, guess, timestamp: current_time,
                    },
                );
        }

        fn claim_reward(ref self: ContractState, round_id: u64) {
            let caller = get_caller_address();

            // Check if reward already claimed
            assert(!self.claimed_rewards.read((round_id, caller)), 'Reward already claimed');

            // Check if round has been drawn
            let round = self.rounds.read(round_id);
            assert(round.is_drawn, 'Round not drawn yet');

            // Check if user is winner
            assert(self.user_is_winner.read((round_id, caller)), 'Not a winner');

            let reward = self.user_rewards.read((round_id, caller));
            assert(reward > 0, 'No reward to claim');

            // Mark as claimed
            self.claimed_rewards.write((round_id, caller), true);

            // Transfer reward
            let strk_dispatcher = IERC20Dispatcher { contract_address: self.strk_token.read() };
            strk_dispatcher.transfer(caller, reward);

            self
                .emit(
                    RewardClaimed {
                        user: caller, round_id, amount: reward, timestamp: get_block_timestamp(),
                    },
                );
        }

        fn get_current_round_info(self: @ContractState) -> (u64, u64, u256, u64) {
            let current_time = get_block_timestamp();
            let first_round = self.rounds.read(1);
            let first_round_start_time = first_round.start_time;

            // Calculate current round ID based on time
            let time_elapsed = current_time - first_round_start_time;
            let current_round_id = (time_elapsed / ROUND_DURATION_SECONDS) + 1;

            // Check if this round exists in storage
            let stored_round = self.rounds.read(current_round_id);

            if stored_round.id == current_round_id {
                // Round exists, return real data
                let total_tickets = self.total_tickets.read(current_round_id);
                (current_round_id, stored_round.end_time, stored_round.prize_pool, total_tickets)
            } else {
                // Round doesn't exist, construct virtual round
                let virtual_start_time = first_round_start_time
                    + (current_round_id - 1) * ROUND_DURATION_SECONDS;
                let virtual_end_time = virtual_start_time + ROUND_DURATION_SECONDS;
                (
                    current_round_id, virtual_end_time, 0, 0,
                ) // prize_pool=0, total_tickets=0 for virtual rounds
            }
        }

        fn get_user_tickets(
            self: @ContractState, user: ContractAddress, round_id: u64,
        ) -> (u8, bool) {
            // Check if round exists in storage
            let round = self.rounds.read(round_id);
            if round.id == 0 {
                // Round doesn't exist - this is a missed/skipped round
                // For missed rounds, no one has tickets
                return (0, false);
            }

            let guess = self.user_tickets.read((round_id, user));
            let is_winner = self.user_is_winner.read((round_id, user));
            (guess, is_winner)
        }

        fn get_user_reward(self: @ContractState, user: ContractAddress, round_id: u64) -> u256 {
            // Check if round exists in storage
            let round = self.rounds.read(round_id);
            if round.id == 0 {
                // Round doesn't exist - this is a missed/skipped round
                // For missed rounds, no one has rewards
                return 0;
            }

            self.user_rewards.read((round_id, user))
        }

        fn get_round_winning_number(self: @ContractState, round_id: u64) -> u8 {
            let round = self.rounds.read(round_id);
            if round.id == 0 {
                // Round doesn't exist - this is a missed/skipped round
                // Missed rounds are considered drawn with winning number 0
                return 0;
            }

            assert(round.is_drawn, 'Round not drawn yet');
            round.winning_number
        }

        fn trigger_draw_if_expired(ref self: ContractState) {
            let current_time = get_block_timestamp();

            // Calculate current round ID dynamically
            let first_round = self.rounds.read(1);
            let first_round_start_time = first_round.start_time;
            let time_elapsed = current_time - first_round_start_time;
            let current_round_id = (time_elapsed / ROUND_DURATION_SECONDS) + 1;

            // Check for expired rounds before creating new round (similar to buy_ticket logic)
            let mut check_round_id = 1;
            loop {
                let check_round = self.rounds.read(check_round_id);
                if check_round.id != check_round_id {
                    // Round doesn't exist, stop checking
                    break;
                }
                if !check_round.is_drawn && current_time >= check_round.end_time {
                    // Found expired round, draw it
                    let rollover = self.draw_winner(check_round_id);

                    // Create next round if needed
                    let next_round_id = check_round_id + 1;
                    let next_round = self.rounds.read(next_round_id);
                    if next_round.id != next_round_id {
                        let next_start_time = check_round.end_time;
                        let new_round = Round {
                            id: next_round_id,
                            start_time: next_start_time,
                            end_time: next_start_time + ROUND_DURATION_SECONDS,
                            prize_pool: rollover,
                            winning_number: 0,
                            is_drawn: false,
                        };
                        self.rounds.write(next_round_id, new_round);
                        self.current_round_id.write(next_round_id);

                        self
                            .emit(
                                NewRoundStarted {
                                    round_id: next_round_id,
                                    start_time: next_start_time,
                                    timestamp: current_time,
                                },
                            );
                    }
                }
                check_round_id += 1;
                if check_round_id > current_round_id {
                    break;
                }
            }

            // If no rounds were processed, check current round specifically
            if check_round_id == 1 {
                let current_round = self.rounds.read(current_round_id);
                if current_round.id == current_round_id
                    && current_time >= current_round.end_time
                    && !current_round.is_drawn {
                    self.draw_winner(current_round_id);
                }
            }
        }

        fn draw_rounds_up_to(ref self: ContractState, target_round_id: u64) {
            assert(target_round_id >= 1, 'Invalid target round ID');

            let current_time = get_block_timestamp();
            let current_round_id = self.get_current_round_id(current_time);

            // Determine the maximum round ID to check (target or current, whichever is smaller)
            let max_round_to_check = if target_round_id < current_round_id {
                target_round_id
            } else {
                current_round_id
            };

            // Process all expired rounds up to the target
            self.process_expired_rounds(current_time, max_round_to_check, target_round_id);
        }

        fn get_statistics(self: @ContractState) -> (u64, u64, u256) {
            // Calculate total rounds based on time elapsed since first round
            let current_time = get_block_timestamp();
            let first_round = self.rounds.read(1);
            let first_round_start_time = first_round.start_time;
            let time_elapsed = current_time - first_round_start_time;
            let total_rounds = (time_elapsed / ROUND_DURATION_SECONDS) + 1;

            (total_rounds, self.total_participants.read(), self.total_prize_pool.read())
        }

        fn get_rounds_info(
            self: @ContractState, round_ids: Array<u64>,
        ) -> Array<(u64, u64, u256, u64, u8, bool)> {
            // Enhanced parameter validation
            assert(
                round_ids.len() <= 10, 'Too many round IDs',
            ); // Limit batch size to prevent gas issues
            assert(round_ids.len() > 0, 'Empty round IDs array');

            let mut result = ArrayTrait::new();
            let mut i = 0;

            while i < round_ids.len() {
                let round_id = *round_ids.at(i);
                assert(round_id >= 1, 'Invalid round ID');

                let round = self.rounds.read(round_id);
                let total_tickets = self.total_tickets.read(round_id);

                // Return round info: (id, end_time, prize_pool, total_tickets, winning_number,
                // is_drawn)
                if round.id == round_id {
                    // Round exists in storage
                    result
                        .append(
                            (
                                round.id,
                                round.end_time,
                                round.prize_pool,
                                total_tickets,
                                round.winning_number,
                                round.is_drawn,
                            ),
                        );
                } else {
                    // Round doesn't exist - construct virtual round info
                    let first_round = self.rounds.read(1);
                    let first_round_start_time = first_round.start_time;
                    let virtual_end_time = first_round_start_time
                        + (round_id * ROUND_DURATION_SECONDS);

                    result
                        .append(
                            (
                                round_id,
                                virtual_end_time,
                                0, // prize_pool
                                0, // total_tickets
                                0, // winning_number
                                true // is_drawn (virtual rounds are considered drawn)
                            ),
                        );
                }

                i += 1;
            }

            result
        }
    }

    #[generate_trait]
    impl PrivateImpl of PrivateTrait {
        fn get_current_round_id(self: @ContractState, current_time: u64) -> u64 {
            let first_round = self.rounds.read(1);
            let first_round_start_time = first_round.start_time;
            let time_elapsed = current_time - first_round_start_time;
            (time_elapsed / ROUND_DURATION_SECONDS) + 1
        }

        fn process_expired_rounds(
            ref self: ContractState,
            current_time: u64,
            max_round_id: u64,
            create_up_to_round_id: u64,
        ) {
            // Find the first round that needs processing by checking backwards from max_round_id
            let mut first_unprocessed_round = 1;
            let mut check_round_id = max_round_id;

            // Check backwards to find the first round that hasn't been drawn
            while check_round_id >= 1 {
                let round = self.rounds.read(check_round_id);
                if round.id == check_round_id {
                    if !round.is_drawn && current_time >= round.end_time {
                        // This round exists, is expired, and not drawn - we need to process from
                        // here
                        first_unprocessed_round = check_round_id;
                        break;
                    }
                    if round.is_drawn {
                        // This round is already drawn, so we need to check the previous round
                        if check_round_id > 1 {
                            check_round_id -= 1;
                            continue;
                        } else {
                            // Round 1 is already drawn, nothing to process
                            return;
                        }
                    }
                    // Round exists but not expired yet, check previous
                    if check_round_id > 1 {
                        check_round_id -= 1;
                        continue;
                    } else {
                        return;
                    }
                } else {
                    // Round doesn't exist, we need to create it and check if it should be drawn
                    first_unprocessed_round = check_round_id;
                    break;
                }
            }

            // Process rounds from first_unprocessed_round to max_round_id
            let mut last_rollover = 0;
            let mut current_check_id = first_unprocessed_round;
            let first_round = self.rounds.read(1);
            let first_round_start_time = first_round.start_time;

            while current_check_id <= max_round_id {
                let round = self.rounds.read(current_check_id);

                if round.id != current_check_id {
                    // Round doesn't exist, create it
                    let round_start_time = first_round_start_time
                        + (current_check_id - 1) * ROUND_DURATION_SECONDS;
                    let new_round = Round {
                        id: current_check_id,
                        start_time: round_start_time,
                        end_time: round_start_time + ROUND_DURATION_SECONDS,
                        prize_pool: 0,
                        winning_number: 0,
                        is_drawn: false,
                    };
                    self.rounds.write(current_check_id, new_round);
                    self.current_round_id.write(current_check_id);
                }

                // Check if round needs to be drawn
                let round_to_check = self.rounds.read(current_check_id);
                if !round_to_check.is_drawn && current_time >= round_to_check.end_time {
                    // Draw the winner
                    last_rollover = self.draw_winner(current_check_id);

                    // Create next round if needed and within processing range
                    let next_round_id = current_check_id + 1;
                    if next_round_id <= max_round_id {
                        let next_round = self.rounds.read(next_round_id);
                        if next_round.id != next_round_id {
                            let next_start_time = round_to_check.end_time;
                            let new_round = Round {
                                id: next_round_id,
                                start_time: next_start_time,
                                end_time: next_start_time + ROUND_DURATION_SECONDS,
                                prize_pool: last_rollover,
                                winning_number: 0,
                                is_drawn: false,
                            };
                            self.rounds.write(next_round_id, new_round);
                            self.current_round_id.write(next_round_id);

                            self
                                .emit(
                                    NewRoundStarted {
                                        round_id: next_round_id,
                                        start_time: next_start_time,
                                        timestamp: current_time,
                                    },
                                );
                        }
                    }
                }

                current_check_id += 1;
            }

            // If we have rollover funds and create_up_to_round_id is beyond max_round_id,
            // create additional rounds up to create_up_to_round_id
            if last_rollover > 0 && create_up_to_round_id > max_round_id {
                let last_processed_round = max_round_id;
                let round_end_time = self.rounds.read(last_processed_round).end_time;
                let time_passed = current_time - round_end_time;
                let full_rounds_passed = time_passed / ROUND_DURATION_SECONDS;

                let rounds_to_create = if create_up_to_round_id > last_processed_round
                    + full_rounds_passed {
                    full_rounds_passed
                } else {
                    create_up_to_round_id - last_processed_round
                };

                if rounds_to_create > 0 {
                    let new_round_id = last_processed_round + rounds_to_create;
                    let new_start_time = round_end_time
                        + (rounds_to_create - 1) * ROUND_DURATION_SECONDS;
                    let new_round = Round {
                        id: new_round_id,
                        start_time: new_start_time,
                        end_time: new_start_time + ROUND_DURATION_SECONDS,
                        prize_pool: last_rollover,
                        winning_number: 0,
                        is_drawn: false,
                    };
                    self.rounds.write(new_round_id, new_round);
                    self.current_round_id.write(new_round_id);

                    self
                        .emit(
                            NewRoundStarted {
                                round_id: new_round_id,
                                start_time: new_start_time,
                                timestamp: current_time,
                            },
                        );
                }
            }
        }

        fn draw_winner(ref self: ContractState, round_id: u64) -> u256 {
            let mut round = self.rounds.read(round_id);
            assert(!round.is_drawn, 'Round already drawn');

            let total_tickets = self.total_tickets.read(round_id);
            let current_prize_pool = round.prize_pool; // Store prize pool before moving round

            // Deduct 10% fee from prize pool
            let fee_amount = current_prize_pool / 10; // 10% fee
            let prize_pool_after_fee = current_prize_pool - fee_amount;

            // Transfer fee to fee address
            if fee_amount > 0 {
                let strk_dispatcher = IERC20Dispatcher { contract_address: self.strk_token.read() };
                strk_dispatcher.transfer(self.fee_address.read(), fee_amount);
            }

            if total_tickets == 0 {
                // No tickets, prize pool after fee rolls to next round
                round.is_drawn = true;
                self.rounds.write(round_id, round);
                self
                    .emit(
                        WinnerDrawn {
                            round_id,
                            winning_number: 0,
                            prize_pool: current_prize_pool,
                            winner_count: 0,
                            reward_per_winner: 0,
                            timestamp: get_block_timestamp(),
                        },
                    );
                return prize_pool_after_fee;
            }

            // Generate winning number using timestamp and round_id for better randomness
            let timestamp = get_block_timestamp();
            let round_seed = round_id.into();
            let combined_seed = timestamp.into() ^ round_seed;

            // Dynamic range calculation based on MIN_GUESS and MAX_GUESS
            let range: u256 = (MAX_GUESS - MIN_GUESS + 1).into();
            let raw_number: u8 = (combined_seed % range).try_into().unwrap();
            let winning_number = raw_number + MIN_GUESS;

            round.winning_number = winning_number;
            round.is_drawn = true;

            // Count winners
            let winner_count = self.correct_guesses.read((round_id, winning_number));

            if winner_count == 0 {
                // No winners, prize pool after fee rolls to next round
                self.rounds.write(round_id, round);
                self
                    .emit(
                        WinnerDrawn {
                            round_id,
                            winning_number,
                            prize_pool: current_prize_pool,
                            winner_count: 0,
                            reward_per_winner: 0,
                            timestamp: get_block_timestamp(),
                        },
                    );
                return prize_pool_after_fee;
            }

            // Winners get 100% of the prize pool after fee (no rollover when there are winners)
            let reward_per_winner = prize_pool_after_fee / winner_count.into();

            // Identify and reward winners
            let mut i = 0;
            let mut actual_winners = 0;

            while i < total_tickets {
                let participant = self.participants.read((round_id, i));
                let guess = self.user_tickets.read((round_id, participant));

                if guess == winning_number {
                    self.user_is_winner.write((round_id, participant), true);
                    self.user_rewards.write((round_id, participant), reward_per_winner);
                    actual_winners += 1;
                }

                i += 1;
            }

            self.rounds.write(round_id, round);

            self
                .emit(
                    WinnerDrawn {
                        round_id,
                        winning_number,
                        prize_pool: current_prize_pool,
                        winner_count: actual_winners,
                        reward_per_winner,
                        timestamp: get_block_timestamp(),
                    },
                );

            // No rollover when there are winners - all funds distributed
            return 0;
        }
    }
}
