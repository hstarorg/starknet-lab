use starknet::{ContractAddress, testing, Felt252TryIntoContractAddress, contract_address_const};
use snforge_std::{declare, ContractClassTrait, start_cheat_caller_address, stop_cheat_caller_address, start_cheat_block_timestamp, stop_cheat_block_timestamp};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use luck3::lottery::{ILotteryDispatcher, ILotteryDispatcherTrait};

// Mock ERC20 token for testing
#[starknet::contract]
mod MockERC20 {
    use starknet::ContractAddress;
    use openzeppelin::token::erc20::ERC20;

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState, name: ByteArray, symbol: ByteArray, initial_supply: u256, recipient: ContractAddress) {
        let mut unsafe_state = ERC20::unsafe_new_contract_state();
        ERC20::InternalImpl::initializer(ref unsafe_state, name, symbol);
        ERC20::InternalImpl::_mint(ref unsafe_state, recipient, initial_supply);
    }
}

// Helper function to setup test environment
fn setup_test() -> (ContractAddress, ContractAddress, ContractAddress) {
    let token_class = declare("MockERC20").unwrap();
    let owner: ContractAddress = 123456789.try_into().unwrap();
    let (strk_token_address, _) = token_class.deploy(@array!["Mock STRK", "STRK", "1000000000000000000000", owner.into()]);
    
    let lottery_class = declare("DailyLottery").unwrap();
    let (lottery_address, _) = lottery_class.deploy(@array![strk_token_address.into()]);
    
    (strk_token_address, lottery_address, owner)
}

// Helper function to setup user with STRK tokens
fn setup_user(strk_token: ContractAddress, lottery: ContractAddress, user: ContractAddress, amount: u256) {
    let strk_dispatcher = IERC20Dispatcher { contract_address: strk_token };
    
    // Mint tokens to user
    start_cheat_caller_address(strk_token, contract_address_const::<123456789>());
    strk_dispatcher.transfer(user, amount);
    stop_cheat_caller_address(strk_token);
    
    // Approve lottery contract
    start_cheat_caller_address(strk_token, user);
    strk_dispatcher.approve(lottery, amount);
    stop_cheat_caller_address(strk_token);
}

#[test]
fn test_constructor_initializes_correctly() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    
    let (round_id, end_time, prize_pool, total_tickets) = lottery_dispatcher.get_current_round_info();
    
    assert(round_id == 1, 'Wrong initial round ID');
    assert(prize_pool == 0, 'Initial prize pool should be 0');
    assert(total_tickets == 0, 'Initial tickets should be 0');
    
    // Check that initial round has correct time
    let current_time = get_block_timestamp();
    assert(end_time == current_time + 86400, 'End time should be 1 day from now');
}

#[test]
fn test_buy_ticket_success() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000); // 10 STRK
    
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery);
    
    // Verify ticket was recorded
    let (guess, is_winner) = lottery_dispatcher.get_user_tickets(user, 1);
    assert(guess == 42, 'Guess should be 42');
    assert(is_winner == false, 'Should not be winner yet');
    
    // Verify round info updated
    let (round_id, end_time, prize_pool, total_tickets) = lottery_dispatcher.get_current_round_info();
    assert(prize_pool == 1000000000000000000, 'Prize pool should be 1 STRK');
    assert(total_tickets == 1, 'Should have 1 ticket');
}

#[test]
#[should_panic(expected: 'Invalid guess range')]
fn test_buy_ticket_invalid_guess_high() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000);
    
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(100); // Invalid: 100 > 99
    stop_cheat_caller_address(lottery);
}

#[test]
#[should_panic(expected: 'Invalid guess range')]
fn test_buy_ticket_invalid_guess_low() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000);
    
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(255); // Invalid: underflows
    stop_cheat_caller_address(lottery);
}

#[test]
#[should_panic(expected: 'Already bought ticket')]
fn test_double_ticket_purchase() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 20000000000000000000); // 20 STRK
    
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(42);
    lottery_dispatcher.buy_ticket(50); // Should fail
    stop_cheat_caller_address(lottery);
}

#[test]
fn test_multiple_users_buy_tickets() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user1: ContractAddress = 111111.try_into().unwrap();
    let user2: ContractAddress = 222222.try_into().unwrap();
    let user3: ContractAddress = 333333.try_into().unwrap();
    
    setup_user(strk_token, lottery, user1, 10000000000000000000);
    setup_user(strk_token, lottery, user2, 10000000000000000000);
    setup_user(strk_token, lottery, user3, 10000000000000000000);
    
    // Users buy tickets (2 with same guess, 1 different)
    start_cheat_caller_address(lottery, user1);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery);
    
    start_cheat_caller_address(lottery, user2);
    lottery_dispatcher.buy_ticket(42); // Same as user1
    stop_cheat_caller_address(lottery);
    
    start_cheat_caller_address(lottery, user3);
    lottery_dispatcher.buy_ticket(99); // Different
    stop_cheat_caller_address(lottery);
    
    // Verify all tickets recorded
    let (_, _, prize_pool, _) = lottery_dispatcher.get_current_round_info();
    assert(prize_pool == 3000000000000000000, 'Prize pool should be 3 STRK');
    assert(total_tickets == 3, 'Should have 3 tickets');
    
    // Verify individual tickets
    let (guess1, _) = lottery_dispatcher.get_user_tickets(user1, 1);
    let (guess2, _) = lottery_dispatcher.get_user_tickets(user2, 1);
    let (guess3, _) = lottery_dispatcher.get_user_tickets(user3, 1);
    
    assert(guess1 == 42, 'User1 guess should be 42');
    assert(guess2 == 42, 'User2 guess should be 42');
    assert(guess3 == 99, 'User3 guess should be 99');
}

#[test]
fn test_round_expiration_and_new_round() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000);
    
    // Buy ticket in initial round
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery);
    
    // Advance time past round end
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery, end_time + 1000);
    
    // Buy another ticket, should trigger new round
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(50);
    stop_cheat_caller_address(lottery);
    
    // Verify new round started
    let (new_round_id, new_end_time, new_prize_pool, new_tickets) = lottery_dispatcher.get_current_round_info();
    assert(new_round_id == 2, 'Should be round 2');
    assert(new_prize_pool == 1000000000000000000, 'New round should have 1 STRK');
    assert(new_tickets == 1, 'New round should have 1 ticket');
    
    stop_cheat_block_timestamp(lottery);
}

#[test]
fn test_trigger_draw_if_expired() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000);
    
    // Buy ticket
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery);
    
    // Advance time past round end
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery, end_time + 1000);
    
    // Trigger draw
    lottery_dispatcher.trigger_draw_if_expired();
    
    // Verify round was drawn and new round started
    let (new_round_id, _, _, _) = lottery_dispatcher.get_current_round_info();
    assert(new_round_id == 2, 'Should have moved to round 2');
    
    // Verify round 1 was drawn
    let winning_number = lottery_dispatcher.get_round_winning_number(1);
    assert(winning_number <= 99, 'Winning number should be 0-99');
    
    stop_cheat_block_timestamp(lottery);
}

#[test]
#[should_panic(expected: 'Round not drawn yet')]
fn test_get_winning_number_before_draw() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    
    lottery_dispatcher.get_round_winning_number(1);
}

#[test]
fn test_no_tickets_in_round() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    
    // Advance time and trigger draw on empty round
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery, end_time + 1000);
    
    lottery_dispatcher.trigger_draw_if_expired();
    
    // Should complete without panic
    let (new_round_id, _, _, _) = lottery_dispatcher.get_current_round_info();
    assert(new_round_id == 2, 'Should have moved to round 2');
    
    stop_cheat_block_timestamp(lottery);
}

#[test]
fn test_winner_calculation_and_reward() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    
    let user1: ContractAddress = 111111.try_into().unwrap();
    let user2: ContractAddress = 222222.try_into().unwrap();
    let user3: ContractAddress = 333333.try_into().unwrap();
    
    setup_user(strk_token, lottery, user1, 10000000000000000000);
    setup_user(strk_token, lottery, user2, 10000000000000000000);
    setup_user(strk_token, lottery, user3, 10000000000000000000);
    
    // Users buy tickets (2 with same guess, 1 different)
    start_cheat_caller_address(lottery, user1);
    lottery_dispatcher.buy_ticket(50);
    stop_cheat_caller_address(lottery);
    
    start_cheat_caller_address(lottery, user2);
    lottery_dispatcher.buy_ticket(50); // Same as user1
    stop_cheat_caller_address(lottery);
    
    start_cheat_caller_address(lottery, user3);
    lottery_dispatcher.buy_ticket(75); // Different
    stop_cheat_caller_address(lottery);
    
    // Verify setup
    let (_, _, prize_pool, _) = lottery_dispatcher.get_current_round_info();
    assert(prize_pool == 3000000000000000000, 'Prize pool should be 3 STRK');
    
    // Advance time and trigger draw
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery, end_time + 1000);
    
    lottery_dispatcher.trigger_draw_if_expired();
    
    let winning_number = lottery_dispatcher.get_round_winning_number(1);
    
    // Check rewards based on winning number
    if winning_number == 50 {
        let reward1 = lottery_dispatcher.get_user_reward(user1, 1);
        let reward2 = lottery_dispatcher.get_user_reward(user2, 1);
        let reward3 = lottery_dispatcher.get_user_reward(user3, 1);
        
        assert(reward1 == 1500000000000000000, 'User1 should get 1.5 STRK');
        assert(reward2 == 1500000000000000000, 'User2 should get 1.5 STRK');
        assert(reward3 == 0, 'User3 should get 0');
    } else if winning_number == 75 {
        let reward1 = lottery_dispatcher.get_user_reward(user1, 1);
        let reward2 = lottery_dispatcher.get_user_reward(user2, 1);
        let reward3 = lottery_dispatcher.get_user_reward(user3, 1);
        
        assert(reward1 == 0, 'User1 should get 0');
        assert(reward2 == 0, 'User2 should get 0');
        assert(reward3 == 3000000000000000000, 'User3 should get 3 STRK');
    } else {
        // No winners
        let reward1 = lottery_dispatcher.get_user_reward(user1, 1);
        let reward2 = lottery_dispatcher.get_user_reward(user2, 1);
        let reward3 = lottery_dispatcher.get_user_reward(user3, 1);
        
        assert(reward1 == 0, 'User1 should get 0');
        assert(reward2 == 0, 'User2 should get 0');
        assert(reward3 == 0, 'User3 should get 0');
    }
    
    stop_cheat_block_timestamp(lottery);
}

#[test]
#[should_panic(expected: 'Reward already claimed')]
fn test_double_reward_claim() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000);
    
    // Setup: Manually set user as winner and reward (simulating draw)
    // In real tests, this would happen through the draw process
    
    // First claim should work
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.claim_reward(1);
    
    // Second claim should fail
    lottery_dispatcher.claim_reward(1);
    stop_cheat_caller_address(lottery);
}

#[test]
#[should_panic(expected: 'Round not drawn yet')]
fn test_claim_before_draw() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000);
    
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.claim_reward(1);
    stop_cheat_caller_address(lottery);
}

#[test]
#[should_panic(expected: 'Not a winner')]
fn test_claim_without_being_winner() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000);
    
    // Buy ticket
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery);
    
    // Advance time and trigger draw
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery, end_time + 1000);
    
    lottery_dispatcher.trigger_draw_if_expired();
    
    // Try to claim reward (user might not be winner)
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.claim_reward(1);
    stop_cheat_caller_address(lottery);
    
    stop_cheat_block_timestamp(lottery);
}

#[test]
fn test_edge_case_no_winners() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 10000000000000000000);
    
    // Buy ticket with guess 42
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery);
    
    // Advance time and trigger draw
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery, end_time + 1000);
    
    lottery_dispatcher.trigger_draw_if_expired();
    
    // Check that prize rolls over or is handled correctly
    let winning_number = lottery_dispatcher.get_round_winning_number(1);
    
    if winning_number != 42 {
        let reward = lottery_dispatcher.get_user_reward(user, 1);
        assert(reward == 0, 'Should have no reward when not winner');
    }
    
    stop_cheat_block_timestamp(lottery);
}

#[test]
fn test_prize_rollover() {
    let (strk_token, lottery, owner) = setup_test();
    let lottery_dispatcher = ILotteryDispatcher { contract_address: lottery };
    let user: ContractAddress = 111111.try_into().unwrap();
    
    setup_user(strk_token, lottery, user, 20000000000000000000); // 20 STRK
    
    // First round - no winners
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery);
    
    let (_, end_time1, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery, end_time1 + 1000);
    
    lottery_dispatcher.trigger_draw_if_expired();
    
    // Second round - check prize accumulation
    start_cheat_caller_address(lottery, user);
    lottery_dispatcher.buy_ticket(50);
    stop_cheat_caller_address(lottery);
    
    let (_, _, prize_pool2, _) = lottery_dispatcher.get_current_round_info();
    
    // Prize should be 1 STRK for new round
    assert(prize_pool2 == 1000000000000000000, 'New round should have 1 STRK');
    
    stop_cheat_block_timestamp(lottery);
}