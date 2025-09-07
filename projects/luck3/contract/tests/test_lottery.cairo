use luck3::lottery::{IDailyLotteryDispatcher, IDailyLotteryDispatcherTrait};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use snforge_std_deprecated::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_block_timestamp,
    start_cheat_caller_address, stop_cheat_block_timestamp, stop_cheat_caller_address, test_address,
};
use starknet::ContractAddress;
use super::mock_erc20::{IMockERC20Dispatcher, IMockERC20DispatcherTrait};

fn setup_test() -> (
    IDailyLotteryDispatcher,
    ContractAddress,
    IMockERC20Dispatcher,
    IERC20Dispatcher,
    ContractAddress,
    ContractAddress,
) {
    // Deploy mock ERC20 token
    let mockerc20_class = declare("MockERC20");
    let mockerc20_class = mockerc20_class.unwrap().contract_class();
    let (mockerc20_address, _) = mockerc20_class.deploy(@array![test_address().into()]).unwrap();

    let strk_dispatcher = IERC20Dispatcher { contract_address: mockerc20_address };
    let mock_dispatcher = IMockERC20Dispatcher { contract_address: mockerc20_address };

    // Deploy lottery contract
    let lottery_class = declare("DailyLottery");
    let lottery_class = lottery_class.unwrap().contract_class();
    let fee_address: ContractAddress = 0x456.try_into().unwrap();
    let calldata = array![mockerc20_address.into(), fee_address.into()];
    let (lottery_address, _) = lottery_class.deploy(@calldata).unwrap();

    let lottery_dispatcher = IDailyLotteryDispatcher { contract_address: lottery_address };

    (
        lottery_dispatcher,
        lottery_address,
        mock_dispatcher,
        strk_dispatcher,
        mockerc20_address,
        fee_address,
    )
}

fn setup_user(
    strk_dispatcher: IERC20Dispatcher,
    lottery: ContractAddress,
    user: ContractAddress,
    amount: u256,
) {
    let mock_dispatcher = IMockERC20Dispatcher {
        contract_address: strk_dispatcher.contract_address,
    };

    // Mint tokens to user
    start_cheat_caller_address(strk_dispatcher.contract_address, test_address());
    mock_dispatcher.mint(user, amount);
    stop_cheat_caller_address(strk_dispatcher.contract_address);

    // Approve lottery contract to spend tokens
    start_cheat_caller_address(strk_dispatcher.contract_address, user);
    strk_dispatcher.approve(lottery, amount);
    stop_cheat_caller_address(strk_dispatcher.contract_address);
}

#[test]
#[should_panic(expected: 'Invalid guess range')]
fn test_buy_ticket_invalid_guess_low() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    // Setup user with tokens
    let user: ContractAddress = 0x111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Try to buy ticket with invalid guess (9 < 10)
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(9); // Should panic with 'Invalid guess range'
    stop_cheat_caller_address(lottery_address);
}

#[test]
#[should_panic(expected: 'Already bought ticket')]
fn test_double_ticket_purchase() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 20000000000000000000); // 20 STRK

    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    lottery_dispatcher.buy_ticket(50); // Should fail
    stop_cheat_caller_address(lottery_address);
}
#[test]
fn test_multiple_users_buy_tickets() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user1: ContractAddress = 111111.try_into().unwrap();
    let user2: ContractAddress = 222222.try_into().unwrap();
    let user3: ContractAddress = 333333.try_into().unwrap();

    setup_user(strk_dispatcher, lottery_address, user1, 10000000000000000000);
    setup_user(strk_dispatcher, lottery_address, user2, 10000000000000000000);
    setup_user(strk_dispatcher, lottery_address, user3, 10000000000000000000);

    // Users buy tickets (2 with same guess, 1 different)
    start_cheat_caller_address(lottery_address, user1);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    start_cheat_caller_address(lottery_address, user2);
    lottery_dispatcher.buy_ticket(42); // Same as user1
    stop_cheat_caller_address(lottery_address);

    start_cheat_caller_address(lottery_address, user3);
    lottery_dispatcher.buy_ticket(75); // Different
    stop_cheat_caller_address(lottery_address);

    // Verify all tickets recorded
    let (_, _, prize_pool, total_tickets) = lottery_dispatcher.get_current_round_info();
    assert(prize_pool == 3000000000000000000, 'Prize pool should be 3 STRK');
    assert(total_tickets == 3, 'Should have 3 tickets');

    // Verify individual tickets
    let (guess1, _) = lottery_dispatcher.get_user_tickets(user1, 1);
    let (guess2, _) = lottery_dispatcher.get_user_tickets(user2, 1);
    let (guess3, _) = lottery_dispatcher.get_user_tickets(user3, 1);

    assert(guess1 == 42, 'User1 guess should be 42');
    assert(guess2 == 42, 'User2 guess should be 42');
    assert(guess3 == 75, 'User3 guess should be 75');
}
#[test]
fn test_round_expiration_and_new_round() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket in initial round
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Advance time past round end
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);

    // Buy another ticket, should trigger new round
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(50);
    stop_cheat_caller_address(lottery_address);

    // Verify new round started
    let (new_round_id, _, new_prize_pool, new_tickets) = lottery_dispatcher
        .get_current_round_info();
    assert(new_round_id == 2, 'Should be round 2');
    // Since round 1 had no winner, 0.9 STRK (after 10% fee) rolls over to round 2
    // Plus the new ticket purchase of 1 STRK = 1.9 STRK total
    assert(new_prize_pool == 1900000000000000000, 'New round should have 1.9 STRK');
    assert(new_tickets == 1, 'New round should have 1 ticket');

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_trigger_draw_if_expired() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Advance time past round end
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);

    // Trigger draw
    lottery_dispatcher.trigger_draw_if_expired();

    // Verify round was drawn and new round started
    let (new_round_id, _, _, _) = lottery_dispatcher.get_current_round_info();
    assert(new_round_id == 2, 'Should have moved to round 2');

    // Verify round 1 was drawn
    let winning_number = lottery_dispatcher.get_round_winning_number(1);
    assert(winning_number <= 99, 'Winning number should be 0-99');

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
#[should_panic(expected: 'Round not drawn yet')]
fn test_get_winning_number_before_draw() {
    let (lottery_dispatcher, _, _, _, _, _) = setup_test();
    lottery_dispatcher.get_round_winning_number(1);
}

#[test]
fn test_no_tickets_in_round() {
    let (lottery_dispatcher, lottery_address, _, _, _, _) = setup_test();

    // Advance time and trigger draw on empty round
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);

    lottery_dispatcher.trigger_draw_if_expired();

    // Should complete without panic
    let (new_round_id, _, _, _) = lottery_dispatcher.get_current_round_info();
    assert(new_round_id == 2, 'Should have moved to round 2');

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_fee_deduction_and_transfer() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, fee_address) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Advance time and trigger draw
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);

    // Check fee address balance before draw
    let fee_balance_before = strk_dispatcher.balance_of(fee_address);

    lottery_dispatcher.trigger_draw_if_expired();

    // Check fee address balance after draw
    let fee_balance_after = strk_dispatcher.balance_of(fee_address);

    assert(
        fee_balance_after == fee_balance_before + 100000000000000000,
        'Fee address should receive STRK',
    );

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_winner_calculation_and_100_percent_distribution() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user1: ContractAddress = 111111.try_into().unwrap();
    let user2: ContractAddress = 222222.try_into().unwrap();
    let user3: ContractAddress = 333333.try_into().unwrap();

    setup_user(strk_dispatcher, lottery_address, user1, 10000000000000000000);
    setup_user(strk_dispatcher, lottery_address, user2, 10000000000000000000);
    setup_user(strk_dispatcher, lottery_address, user3, 10000000000000000000);

    // Users buy tickets (2 with same guess, 1 different)
    start_cheat_caller_address(lottery_address, user1);
    lottery_dispatcher.buy_ticket(50);
    stop_cheat_caller_address(lottery_address);

    start_cheat_caller_address(lottery_address, user2);
    lottery_dispatcher.buy_ticket(50); // Same as user1
    stop_cheat_caller_address(lottery_address);

    start_cheat_caller_address(lottery_address, user3);
    lottery_dispatcher.buy_ticket(75); // Different
    stop_cheat_caller_address(lottery_address);

    // Verify setup - 3 STRK prize pool
    let (_, _, prize_pool, _) = lottery_dispatcher.get_current_round_info();
    assert(prize_pool == 3000000000000000000, 'Prize pool should be 3 STRK');

    // Advance time and trigger draw
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);

    lottery_dispatcher.trigger_draw_if_expired();

    let winning_number = lottery_dispatcher.get_round_winning_number(1);

    // Check rewards based on winning number
    if winning_number == 50 {
        let reward1 = lottery_dispatcher.get_user_reward(user1, 1);
        let reward2 = lottery_dispatcher.get_user_reward(user2, 1);
        let reward3 = lottery_dispatcher.get_user_reward(user3, 1);

        // After 10% fee: 2.7 STRK remaining, split between 2 winners = 1.35 STRK each
        assert(reward1 == 1350000000000000000, 'User1 should get 1.35 STRK');
        assert(reward2 == 1350000000000000000, 'User2 should get 1.35 STRK');
        assert(reward3 == 0, 'User3 should get 0');
    } else if winning_number == 75 {
        let reward1 = lottery_dispatcher.get_user_reward(user1, 1);
        let reward2 = lottery_dispatcher.get_user_reward(user2, 1);
        let reward3 = lottery_dispatcher.get_user_reward(user3, 1);

        // After 10% fee: 2.7 STRK to single winner
        assert(reward1 == 0, 'User1 should get 0');
        assert(reward2 == 0, 'User2 should get 0');
        assert(reward3 == 2700000000000000000, 'User3 should get 2.7 STRK');
    } else {
        // No winners - all funds roll over
        let reward1 = lottery_dispatcher.get_user_reward(user1, 1);
        let reward2 = lottery_dispatcher.get_user_reward(user2, 1);
        let reward3 = lottery_dispatcher.get_user_reward(user3, 1);

        assert(reward1 == 0, 'User1 should get 0');
        assert(reward2 == 0, 'User2 should get 0');
        assert(reward3 == 0, 'User3 should get 0');

        // Check that next round has the rolled over prize pool
        let (_, _, next_prize_pool, _) = lottery_dispatcher.get_current_round_info();
        assert(next_prize_pool == 2700000000000000000, 'Next round should have 2.7 STRK');
    }

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_prize_rollover_no_winners() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket with guess 42
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Advance time and trigger draw
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);

    lottery_dispatcher.trigger_draw_if_expired();

    // Check next round prize pool - should have 0.9 STRK (1 STRK - 10% fee)
    let (_, _, next_prize_pool, _) = lottery_dispatcher.get_current_round_info();
    assert(next_prize_pool == 900000000000000000, 'Next round should have 0.9 STRK');

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_skipped_rounds_gas_optimization() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket in round 1
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Advance time by 3 days (simulating 3 skipped rounds)
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + (3 * 86400) + 1000);

    // Trigger draw - should advance to round 5 (1 + 3 + 1)
    lottery_dispatcher.trigger_draw_if_expired();

    // Verify round advanced correctly
    let (current_round_id, _, _, _) = lottery_dispatcher.get_current_round_info();
    // Should advance to round 5 after 3 skipped days
    assert(current_round_id == 5, 'Should advance to round 5');

    // Verify we can query skipped rounds (should return default values)
    let winning_number = lottery_dispatcher.get_round_winning_number(2); // Skipped round
    // Skipped round should have winning number 0
    assert(winning_number == 0, 'Should have winning number 0');

    let (guess, is_winner) = lottery_dispatcher.get_user_tickets(user, 2); // Skipped round
    // Skipped round should have no user tickets
    assert(guess == 0, 'Should have no user tickets');
    // Skipped round should have no winners
    assert(!is_winner, 'Should have no winners');

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_missed_round_queries() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Query round 999 (doesn't exist)
    let winning_number = lottery_dispatcher.get_round_winning_number(999);
    // Non-existent round should return 0
    assert(winning_number == 0, 'Should return 0');

    let (guess, is_winner) = lottery_dispatcher.get_user_tickets(user, 999);
    // Non-existent round should have no tickets
    assert(guess == 0, 'Should have no tickets');
    // Non-existent round should have no winners
    assert(!is_winner, 'Should have no winners');

    let reward = lottery_dispatcher.get_user_reward(user, 999);
    // Non-existent round should have no rewards
    assert(reward == 0, 'Should have no rewards');
}

#[test]
#[should_panic(expected: 'Reward already claimed')]
fn test_double_reward_claim() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket with guess 42
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Advance time to a specific timestamp that will generate winning number 42
    // We need timestamp % 100 == 42
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    let target_timestamp = end_time + 1000;
    // Adjust timestamp so that (timestamp % 100) == 42
    let winning_timestamp = if target_timestamp % 100 <= 42 {
        target_timestamp + (42 - (target_timestamp % 100))
    } else {
        target_timestamp + (100 - (target_timestamp % 100)) + 42
    };

    start_cheat_block_timestamp(lottery_address, winning_timestamp);
    lottery_dispatcher.trigger_draw_if_expired();

    // Verify user is winner (winning number should be 42)
    let winning_number = lottery_dispatcher.get_round_winning_number(1);
    assert(winning_number == 42, 'Winning number should be 42');

    let (_, is_winner) = lottery_dispatcher.get_user_tickets(user, 1);
    assert(is_winner, 'User should be winner');

    // First claim should work
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.claim_reward(1);

    // Second claim should panic
    lottery_dispatcher.claim_reward(1); // Should panic with 'Reward already claimed'
    stop_cheat_caller_address(lottery_address);

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
#[should_panic(expected: 'Round not drawn yet')]
fn test_claim_before_draw() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.claim_reward(1);
    stop_cheat_caller_address(lottery_address);
}

#[test]
#[should_panic(expected: 'Not a winner')]
fn test_claim_without_being_winner() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Advance time and trigger draw
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);

    lottery_dispatcher.trigger_draw_if_expired();

    // Try to claim reward (user might not be winner)
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.claim_reward(1);
    stop_cheat_caller_address(lottery_address);

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_edge_case_no_winners() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket with guess 42
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Advance time and trigger draw
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);

    lottery_dispatcher.trigger_draw_if_expired();

    // Check that prize rolls over or is handled correctly
    let winning_number = lottery_dispatcher.get_round_winning_number(1);

    if winning_number != 42 {
        let reward = lottery_dispatcher.get_user_reward(user, 1);
        // Should have no reward when not winner
        assert(reward == 0, 'Should have no reward');
    }

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_prize_rollover() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();
    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 20000000000000000000); // 20 STRK

    // First round - no winners
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    let (_, end_time1, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time1 + 1000);

    lottery_dispatcher.trigger_draw_if_expired();

    // Second round - check prize accumulation
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(50);
    stop_cheat_caller_address(lottery_address);

    let (_, _, prize_pool2, _) = lottery_dispatcher.get_current_round_info();

    // Prize should be 1.9 STRK (0.9 from rollover + 1 from new ticket)
    assert(prize_pool2 == 1900000000000000000, 'New round should have 1.9 STRK');

    stop_cheat_block_timestamp(lottery_address);
}


#[test]
fn test_multiple_rounds_with_different_winners() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user1: ContractAddress = 111111.try_into().unwrap();
    let user2: ContractAddress = 222222.try_into().unwrap();

    setup_user(strk_dispatcher, lottery_address, user1, 10000000000000000000);
    setup_user(strk_dispatcher, lottery_address, user2, 10000000000000000000);

    // Round 1: Both users buy tickets
    start_cheat_caller_address(lottery_address, user1);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    start_cheat_caller_address(lottery_address, user2);
    lottery_dispatcher.buy_ticket(42);
    stop_cheat_caller_address(lottery_address);

    // Complete round 1
    let (_, end_time1, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time1 + 1000);
    lottery_dispatcher.trigger_draw_if_expired();

    // Round 2: Only user1 buys ticket
    start_cheat_caller_address(lottery_address, user1);
    lottery_dispatcher.buy_ticket(50);
    stop_cheat_caller_address(lottery_address);

    // Complete round 2
    let (_, end_time2, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time2 + 1000);
    lottery_dispatcher.trigger_draw_if_expired();

    // Verify round progression
    let (current_round_id, _, _, _) = lottery_dispatcher.get_current_round_info();
    assert(current_round_id == 3, 'Should be on round 3');

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_boundary_guess_values() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user: ContractAddress = 111111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 20000000000000000000);

    start_cheat_caller_address(lottery_address, user);

    // Test minimum valid guess (10)
    lottery_dispatcher.buy_ticket(10);

    // Advance to next round
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);
    lottery_dispatcher.buy_ticket(99); // Test maximum valid guess (99)

    stop_cheat_caller_address(lottery_address);
    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_round_id_continuity() {
    let (lottery_dispatcher, lottery_address, _, _, _, _) = setup_test();

    // Test that round IDs are sequential and continuous
    let (round_id1, _, _, _) = lottery_dispatcher.get_current_round_info();
    assert(round_id1 == 1, 'Initial round should be 1');

    // Advance time and trigger new round
    let (_, end_time, _, _) = lottery_dispatcher.get_current_round_info();
    start_cheat_block_timestamp(lottery_address, end_time + 1000);
    lottery_dispatcher.trigger_draw_if_expired();

    let (round_id2, _, _, _) = lottery_dispatcher.get_current_round_info();
    assert(round_id2 == 2, 'Next round should be 2');

    stop_cheat_block_timestamp(lottery_address);
}
