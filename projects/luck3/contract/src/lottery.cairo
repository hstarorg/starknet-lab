use starknet::{ContractAddress};
use starknet::storage::*;

#[starknet::interface]
trait IDailyLottery<TContractState> {
    fn buy_ticket(ref self: TContractState, guess: u8);
    fn claim_reward(ref self: TContractState, round_id: u64);
    fn get_current_round_info(self: @TContractState) -> (u64, u64, u256, u64);
    fn get_user_tickets(self: @TContractState, user: ContractAddress, round_id: u64) -> (u8, bool);
    fn get_user_reward(self: @TContractState, user: ContractAddress, round_id: u64) -> u256;
    fn get_round_winning_number(self: @TContractState, round_id: u64) -> u8;
    fn trigger_draw_if_expired(ref self: TContractState);
}

#[starknet::contract]
mod DailyLottery {
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use starknet::storage::*;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    const DAY_IN_SECONDS: u64 = 86400;
    const TICKET_COST: u256 = 1000000000000000000; // 1 STRK = 10^18 wei
    const MIN_GUESS: u8 = 10;
    const MAX_GUESS: u8 = 99;

    #[storage]
    struct Storage {
        strk_token: ContractAddress,
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
    fn constructor(ref self: ContractState, strk_token: ContractAddress) {
        self.strk_token.write(strk_token);
        self.current_round_id.write(1);
        
        let current_time = get_block_timestamp();
        let first_round = Round {
            id: 1,
            start_time: current_time,
            end_time: current_time + DAY_IN_SECONDS,
            prize_pool: 0,
            winning_number: 0,
            is_drawn: false,
        };
        self.rounds.write(1, first_round);
        
        self.emit(NewRoundStarted {
            round_id: 1,
            start_time: current_time,
            timestamp: current_time,
        });
    }

    #[abi(embed_v0)]
    impl ILotteryImpl of super::IDailyLottery<ContractState> {
        fn buy_ticket(ref self: ContractState, guess: u8) {
            assert(guess >= MIN_GUESS && guess <= MAX_GUESS, 'Invalid guess range');
            
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let mut current_round_id = self.current_round_id.read();
            let mut current_round = self.rounds.read(current_round_id);
            
            // Check if user already has ticket for this round
            let existing_guess = self.user_tickets.read((current_round_id, caller));
            assert(existing_guess == 0, 'Already bought ticket');
            
            // Check if current round has expired and handle drawing
            if current_time >= current_round.end_time {
                self.trigger_draw_if_expired();
                current_round_id = self.current_round_id.read();
                current_round = self.rounds.read(current_round_id);
            }
            
            // Transfer STRK tokens for ticket purchase
            let strk_dispatcher = IERC20Dispatcher { contract_address: self.strk_token.read() };
            strk_dispatcher.transfer_from(caller, get_contract_address(), TICKET_COST);
            
            // Record ticket and participant
            let ticket_index = self.total_tickets.read(current_round_id);
            self.user_tickets.write((current_round_id, caller), guess);
            self.participants.write((current_round_id, ticket_index), caller);
            self.participant_indices.write((current_round_id, caller), ticket_index);
            
            // Update round info
            current_round.prize_pool += TICKET_COST;
            
            // Update ticket counts
            let total_tickets = self.total_tickets.read(current_round_id) + 1;
            self.total_tickets.write(current_round_id, total_tickets);
            
            // Update guess counts
            let guess_count = self.correct_guesses.read((current_round_id, guess)) + 1;
            self.correct_guesses.write((current_round_id, guess), guess_count);
            
            self.rounds.write(current_round_id, current_round);
            
            self.emit(TicketBought {
                user: caller,
                round_id: current_round_id,
                guess,
                timestamp: current_time,
            });
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
            
            self.emit(RewardClaimed {
                user: caller,
                round_id,
                amount: reward,
                timestamp: get_block_timestamp(),
            });
        }

        fn get_current_round_info(self: @ContractState) -> (u64, u64, u256, u64) {
            let current_round_id = self.current_round_id.read();
            let current_round = self.rounds.read(current_round_id);
            let total_tickets = self.total_tickets.read(current_round_id);
            (current_round_id, current_round.end_time, current_round.prize_pool, total_tickets)
        }

        fn get_user_tickets(self: @ContractState, user: ContractAddress, round_id: u64) -> (u8, bool) {
            let guess = self.user_tickets.read((round_id, user));
            let is_winner = self.user_is_winner.read((round_id, user));
            (guess, is_winner)
        }

        fn get_user_reward(self: @ContractState, user: ContractAddress, round_id: u64) -> u256 {
            self.user_rewards.read((round_id, user))
        }

        fn get_round_winning_number(self: @ContractState, round_id: u64) -> u8 {
            let round = self.rounds.read(round_id);
            assert(round.is_drawn, 'Round not drawn yet');
            round.winning_number
        }

        fn trigger_draw_if_expired(ref self: ContractState) {
            let current_time = get_block_timestamp();
            let mut current_round_id = self.current_round_id.read();
            let mut current_round = self.rounds.read(current_round_id);
            
            if current_time >= current_round.end_time && !current_round.is_drawn {
                self.draw_winner(current_round_id);
                
                // Start new round
                let new_round_id = current_round_id + 1;
                let new_round = Round {
                    id: new_round_id,
                    start_time: current_time,
                    end_time: current_time + DAY_IN_SECONDS,
                    prize_pool: 0,
                    winning_number: 0,
                    is_drawn: false,
                };
                self.rounds.write(new_round_id, new_round);
                self.current_round_id.write(new_round_id);
                
                self.emit(NewRoundStarted {
                    round_id: new_round_id,
                    start_time: current_time,
                    timestamp: current_time,
                });
            }
        }
    }

    #[generate_trait]
    impl PrivateImpl of PrivateTrait {
        fn draw_winner(ref self: ContractState, round_id: u64) {
            let mut round = self.rounds.read(round_id);
            assert(!round.is_drawn, 'Round already drawn');
            
            let total_tickets = self.total_tickets.read(round_id);
            if total_tickets == 0 {
                // No tickets, no winner
                round.is_drawn = true;
                self.rounds.write(round_id, round);
                return;
            }
            
            // Generate winning number using block timestamp
            let timestamp = get_block_timestamp();
            let hash_data: u256 = timestamp.into();
            let winning_number = ((hash_data % 100_u256) & 0xFF).try_into().unwrap();
            
            round.winning_number = winning_number;
            round.is_drawn = true;
            let prize_pool = round.prize_pool;
            
            // Count winners
            let winner_count = self.correct_guesses.read((round_id, winning_number));
            
            if winner_count == 0 {
                // No winners, prize rolls to next round
                let reward_per_winner = 0;
                self.rounds.write(round_id, round);
                self.emit(WinnerDrawn {
                    round_id,
                    winning_number,
                    prize_pool,
                    winner_count: 0,
                    reward_per_winner,
                    timestamp: get_block_timestamp(),
                });
                return;
            }
            
            // Calculate reward per winner
            let reward_per_winner = prize_pool / winner_count.into();
            
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
            
            self.emit(WinnerDrawn {
                round_id,
                winning_number,
                prize_pool,
                winner_count: actual_winners,
                reward_per_winner,
                timestamp: get_block_timestamp(),
            });
        }
    }
}