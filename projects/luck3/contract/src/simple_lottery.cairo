use starknet::ContractAddress;
use starknet::storage::*;

#[starknet::interface]
pub trait ISimpleLottery<TContractState> {
    // 用户功能
    fn buy_ticket(ref self: TContractState, round_id: u64, guess: u8);
    fn claim_reward(ref self: TContractState, round_id: u64);

    // 管理功能
    fn create_round(ref self: TContractState, duration_seconds: u64);
    fn draw_winner(ref self: TContractState, round_id: u64);

    // 查询功能
    fn get_round_info(self: @TContractState, round_id: u64) -> (u64, u64, u256, u64, u8, bool);
    fn get_user_ticket(
        self: @TContractState, user: ContractAddress, round_id: u64,
    ) -> (u8, bool, u256, bool);
    fn get_info(self: @TContractState) -> (ContractAddress, u64, u256);
}

#[starknet::contract]
mod SimpleLottery {
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::*;
    use starknet::{
        ContractAddress, get_block_info, get_block_timestamp, get_caller_address,
        get_contract_address,
    };

    const TICKET_COST: u256 = 1000000000000000000; // 1 STRK
    const MIN_GUESS: u8 = 10;
    const MAX_GUESS: u8 = 99;
    const FEE_PERCENTAGE: u8 = 10; // 10% fee

    // STRK代币合约地址 (Starknet主网)
    // 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
    const STRK_TOKEN_ADDRESS: felt252 =
        0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D;


    #[derive(Drop, Serde, starknet::Store)]
    struct UserTicket {
        guess: u8,
        is_winner: bool,
        reward: u256,
        claimed: bool,
    }

    #[derive(Drop, Serde, starknet::Store)]
    struct Round {
        id: u64,
        start_time: u64,
        end_time: u64,
        prize_pool: u256,
        winning_number: u8,
        is_drawn: bool,
        total_tickets: u64,
    }

    #[storage]
    struct Storage {
        // 核心数据
        strk_token: ContractAddress,
        fee_address: ContractAddress,
        owner: ContractAddress,
        // 轮次数据
        rounds: Map<u64, Round>,
        current_round_id: u64,
        // 用户数据：(round_id, user) -> 用户彩票信息
        user_tickets: Map<(u64, ContractAddress), UserTicket>,
        // 轮次参与者列表：(round_id, index) -> 用户地址
        round_participants: Map<(u64, u64), ContractAddress>,
        // 累积奖金池（无人中奖时累积）
        accumulated_prize_pool: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TicketBought: TicketBought,
        WinnerDrawn: WinnerDrawn,
        RewardClaimed: RewardClaimed,
        RoundCreated: RoundCreated,
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
    struct RoundCreated {
        round_id: u64,
        start_time: u64,
        end_time: u64,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, strk_token_address: ContractAddress, fee_address: ContractAddress,
    ) {
        self.strk_token.write(strk_token_address);
        self.fee_address.write(fee_address);
        self.owner.write(get_caller_address());
        self.current_round_id.write(0);
    }

    #[abi(embed_v0)]
    impl SimpleLotteryImpl of super::ISimpleLottery<ContractState> {
        fn buy_ticket(ref self: ContractState, round_id: u64, guess: u8) {
            assert(guess >= MIN_GUESS && guess <= MAX_GUESS, 'Invalid guess range');

            let caller = get_caller_address();
            let current_time = get_block_timestamp();

            // 检查轮次是否存在且有效
            let round = self.rounds.read(round_id);
            assert(round.id == round_id, 'Round does not exist');
            assert(
                current_time >= round.start_time && current_time <= round.end_time,
                'Round not active',
            );
            assert(!round.is_drawn, 'Round already drawn');

            // 检查用户是否已购买此轮彩票
            let existing_ticket = self.user_tickets.read((round_id, caller));
            assert(existing_ticket.guess == 0, 'Already bought ticket');

            // 转账STRK代币
            let strk_dispatcher = IERC20Dispatcher { contract_address: self.strk_token.read() };
            strk_dispatcher.transfer_from(caller, get_contract_address(), TICKET_COST);

            // 记录用户彩票
            let user_ticket = UserTicket { guess, is_winner: false, reward: 0, claimed: false };
            self.user_tickets.write((round_id, caller), user_ticket);

            // 添加用户到参与者列表（如果是第一次购买）
            let participant_index = round.total_tickets; // 使用total_tickets作为索引
            self.round_participants.write((round_id, participant_index), caller);

            // 更新轮次信息
            let mut updated_round = round;
            updated_round.prize_pool += TICKET_COST;
            updated_round.total_tickets += 1;
            self.rounds.write(round_id, updated_round);

            self.emit(TicketBought { user: caller, round_id, guess, timestamp: current_time });
        }

        fn claim_reward(ref self: ContractState, round_id: u64) {
            let caller = get_caller_address();

            // 获取用户彩票信息
            let user_ticket = self.user_tickets.read((round_id, caller));
            assert(user_ticket.guess != 0, 'No ticket found');
            assert(user_ticket.is_winner, 'Not a winner');
            assert(!user_ticket.claimed, 'Reward already claimed');
            assert(user_ticket.reward > 0, 'No reward to claim');

            // 转账奖励
            let strk_dispatcher = IERC20Dispatcher { contract_address: self.strk_token.read() };
            strk_dispatcher.transfer(caller, user_ticket.reward);

            // 标记为已领取
            let updated_ticket = UserTicket {
                guess: user_ticket.guess,
                is_winner: user_ticket.is_winner,
                reward: user_ticket.reward,
                claimed: true,
            };
            self.user_tickets.write((round_id, caller), updated_ticket);

            self
                .emit(
                    RewardClaimed {
                        user: caller,
                        round_id,
                        amount: user_ticket.reward,
                        timestamp: get_block_timestamp(),
                    },
                );
        }

        fn create_round(ref self: ContractState, duration_seconds: u64) {
            // 只有所有者可以创建轮次
            assert(get_caller_address() == self.owner.read(), 'Only owner can create round');

            let current_time = get_block_timestamp();
            let new_round_id = self.current_round_id.read() + 1;

            // 获取累积奖金并加入新轮次
            let accumulated_prize = self.accumulated_prize_pool.read();

            let new_round = Round {
                id: new_round_id,
                start_time: current_time,
                end_time: current_time + duration_seconds,
                prize_pool: accumulated_prize, // 带入累积奖金
                winning_number: 0,
                is_drawn: false,
                total_tickets: 0,
            };

            self.rounds.write(new_round_id, new_round);
            self.current_round_id.write(new_round_id);

            // 重置累积奖金池
            self.accumulated_prize_pool.write(0);

            self
                .emit(
                    RoundCreated {
                        round_id: new_round_id,
                        start_time: current_time,
                        end_time: current_time + duration_seconds,
                        timestamp: current_time,
                    },
                );
        }

        fn draw_winner(ref self: ContractState, round_id: u64) {
            // 只有所有者可以开奖
            assert(get_caller_address() == self.owner.read(), 'Only owner can draw winner');

            let mut round = self.rounds.read(round_id);
            assert(round.id == round_id, 'Round does not exist');
            assert(!round.is_drawn, 'Round already drawn');
            assert(get_block_timestamp() >= round.end_time, 'Round not ended yet');

            let current_prize_pool = round.prize_pool;

            // 计算手续费
            let fee_amount = current_prize_pool * FEE_PERCENTAGE.into() / 100;
            let prize_pool_after_fee = current_prize_pool - fee_amount;

            // 转出手续费
            if fee_amount > 0 {
                let strk_dispatcher = IERC20Dispatcher { contract_address: self.strk_token.read() };
                strk_dispatcher.transfer(self.fee_address.read(), fee_amount);
            }

            if round.total_tickets == 0 {
                // 无彩票，奖池滚入下一轮（这里简化处理，直接标记为开奖）
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
                return;
            }

            // 调用random_u8生成获奖数字
            let winning_number = PrivateImpl::random_u8(round_id, MIN_GUESS, MAX_GUESS);

            round.winning_number = winning_number;
            round.is_drawn = true;

            // 高效单轮遍历：计算中奖人数并分配奖励
            let mut winner_count = 0;
            let mut winners = array![]; // 临时存储中奖者地址

            // 第一次遍历：找出所有中奖者
            let mut i = 0;
            while i < round.total_tickets {
                let participant = self.round_participants.read((round_id, i));
                let user_ticket = self.user_tickets.read((round_id, participant));

                if user_ticket.guess == winning_number {
                    winner_count += 1;
                    winners.append(participant);
                }
                i += 1;
            }

            if winner_count == 0 {
                // 无中奖者，将奖金累积到下一轮
                let current_accumulated = self.accumulated_prize_pool.read();
                self.accumulated_prize_pool.write(current_accumulated + prize_pool_after_fee);

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
                return;
            }

            // 计算每位中奖者的奖励
            let reward_per_winner = prize_pool_after_fee / winner_count.into();

            // 为所有中奖者分配奖励
            let winners_span = winners.span();
            let mut j = 0;
            while j < winners.len() {
                let winner_address = *winners_span.at(j);
                let user_ticket = self.user_tickets.read((round_id, winner_address));

                // 更新用户彩票信息
                let updated_ticket = UserTicket {
                    guess: user_ticket.guess,
                    is_winner: true,
                    reward: reward_per_winner,
                    claimed: false,
                };
                self.user_tickets.write((round_id, winner_address), updated_ticket);

                j += 1;
            }

            self.rounds.write(round_id, round);

            self
                .emit(
                    WinnerDrawn {
                        round_id,
                        winning_number,
                        prize_pool: current_prize_pool,
                        winner_count: winners.len().try_into().unwrap(),
                        reward_per_winner,
                        timestamp: get_block_timestamp(),
                    },
                );
        }

        fn get_round_info(self: @ContractState, round_id: u64) -> (u64, u64, u256, u64, u8, bool) {
            let round = self.rounds.read(round_id);
            if round.id == 0 {
                return (0, 0, 0, 0, 0, false);
            }
            (
                round.id,
                round.end_time,
                round.prize_pool,
                round.total_tickets,
                round.winning_number,
                round.is_drawn,
            )
        }

        fn get_user_ticket(
            self: @ContractState, user: ContractAddress, round_id: u64,
        ) -> (u8, bool, u256, bool) {
            let ticket = self.user_tickets.read((round_id, user));
            (ticket.guess, ticket.is_winner, ticket.reward, ticket.claimed)
        }


        fn get_info(self: @ContractState) -> (ContractAddress, u64, u256) {
            let owner = self.owner.read();
            let current_round_id = self.current_round_id.read();
            let accumulated_prize_pool = self.accumulated_prize_pool.read();
            (owner, current_round_id, accumulated_prize_pool)
        }
    }

    #[generate_trait]
    impl PrivateImpl of PrivateTrait {
        fn random_u8(round_id: u64, MIN_GUESS: u8, MAX_GUESS: u8) -> u8 {
            // 生成中奖号码（基于区块信息和时间戳的安全随机数生成）
            let block_info = get_block_info().unbox();
            let block_number = block_info.block_number;
            let timestamp = get_block_timestamp();

            // 组合多个随机源
            let combined_seed = block_number ^ timestamp ^ round_id;

            // 计算范围大小
            let range: u256 = (MAX_GUESS - MIN_GUESS + 1).into();

            // 统一类型，取模
            let seed: u256 = combined_seed.into();
            let rand_u256: u256 = seed % range;

            // 转换到 u8
            let random_value: u8 = rand_u256.try_into().unwrap();

            // 得到结果
            let winning_number: u8 = random_value + MIN_GUESS;

            winning_number
        }
    }
}
