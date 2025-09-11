use luck3::simple_lottery::{ISimpleLotteryDispatcher, ISimpleLotteryDispatcherTrait};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use snforge_std_deprecated::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_block_timestamp,
    start_cheat_caller_address, stop_cheat_block_timestamp, stop_cheat_caller_address, test_address,
};
use starknet::ContractAddress;
use super::mock_erc20::{IMockERC20Dispatcher, IMockERC20DispatcherTrait};

const ROUND_DURATION_SECONDS: u64 = 300;

fn setup_test() -> (
    ISimpleLotteryDispatcher,
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
    let lottery_class = declare("SimpleLottery");
    let lottery_class = lottery_class.unwrap().contract_class();
    let fee_address: ContractAddress = 0x456.try_into().unwrap();
    let calldata = array![mockerc20_address.into(), fee_address.into()];
    let (lottery_address, _) = lottery_class.deploy(@calldata).unwrap();

    let lottery_dispatcher = ISimpleLotteryDispatcher { contract_address: lottery_address };

    // Create initial round
    start_cheat_caller_address(lottery_address, test_address());
    lottery_dispatcher.create_round(ROUND_DURATION_SECONDS);
    stop_cheat_caller_address(lottery_address);

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

fn get_current_round_info(lottery_dispatcher: ISimpleLotteryDispatcher) -> (u64, u64, u256, u64, u8, bool) {
    let current_round_id = lottery_dispatcher.get_current_round_id();
    lottery_dispatcher.get_round_info(current_round_id)
}

fn advance_to_next_round(lottery_dispatcher: ISimpleLotteryDispatcher) {
    let (_, end_time, _, _, _, _) = get_current_round_info(lottery_dispatcher);
    start_cheat_block_timestamp(lottery_dispatcher.contract_address, end_time + 1);
}

fn advance_rounds(lottery_dispatcher: ISimpleLotteryDispatcher, rounds: u64) {
    let (_, end_time, _, _, _, _) = get_current_round_info(lottery_dispatcher);
    let advance_time = rounds * ROUND_DURATION_SECONDS;
    start_cheat_block_timestamp(lottery_dispatcher.contract_address, end_time + advance_time + 1);
}

// Helper function to get winning number from round info
fn get_round_winning_number(lottery_dispatcher: ISimpleLotteryDispatcher, round_id: u64) -> u8 {
    let (_, _, _, _, winning_number, _) = lottery_dispatcher.get_round_info(round_id);
    winning_number
}

// Helper function to get user reward from ticket info
fn get_user_reward(lottery_dispatcher: ISimpleLotteryDispatcher, user: ContractAddress, round_id: u64) -> u256 {
    let (_, _, reward, _) = lottery_dispatcher.get_user_ticket(user, round_id);
    reward
}

// Helper function to get user ticket info
fn get_user_tickets(lottery_dispatcher: ISimpleLotteryDispatcher, user: ContractAddress, round_id: u64) -> (u8, bool) {
    let (guess, is_winner, _, _) = lottery_dispatcher.get_user_ticket(user, round_id);
    (guess, is_winner)
}

#[test]
fn test_buy_ticket_valid() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    // Setup user with tokens
    let user: ContractAddress = 0x111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket with valid guess
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(1, 42); // round_id = 1, guess = 42
    stop_cheat_caller_address(lottery_address);

    // Verify ticket was purchased
    let (guess, is_winner, reward, claimed) = lottery_dispatcher.get_user_ticket(user, 1);
    assert(guess == 42, 'Invalid guess');
    assert(!is_winner, 'Should not be winner');
    assert(reward == 0, 'No reward yet');
    assert(!claimed, 'Not claimed yet');

    // Verify round info updated
    let (_, _, prize_pool, total_tickets, _, is_drawn) = lottery_dispatcher.get_round_info(1);
    assert(prize_pool == 1000000000000000000, 'Wrong prize pool');
    assert(total_tickets == 1, 'Wrong ticket count');
    assert(!is_drawn, 'Round already drawn');
}

#[test]
fn test_create_round() {
    let (lottery_dispatcher, lottery_address, _, _, _, _) = setup_test();

    // Create a new round
    start_cheat_caller_address(lottery_address, test_address());
    lottery_dispatcher.create_round(600); // 10 minutes
    stop_cheat_caller_address(lottery_address);

    // Verify new round was created
    let current_round_id = lottery_dispatcher.get_current_round_id();
    assert(current_round_id == 2, 'Wrong current round');

    let (round_id, _, _, _, _, _) = lottery_dispatcher.get_round_info(2);
    assert(round_id == 2, 'Round 2 not found');
}

#[test]
fn test_draw_winner() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    // Setup user with tokens
    let user: ContractAddress = 0x111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(1, 42);
    stop_cheat_caller_address(lottery_address);

    // Advance time past round end
    let (_, end_time, _, _, _, _) = lottery_dispatcher.get_round_info(1);
    start_cheat_block_timestamp(lottery_address, end_time + 1);

    // Draw winner
    start_cheat_caller_address(lottery_address, test_address());
    lottery_dispatcher.draw_winner(1);
    stop_cheat_caller_address(lottery_address);

    // Verify round was drawn
    let (_, _, _, _, winning_number, is_drawn) = lottery_dispatcher.get_round_info(1);
    assert(is_drawn, 'Round should be drawn');
    assert(winning_number >= 10 && winning_number <= 99, 'Winning number should be valid');

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_claim_reward() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    // Setup user with tokens
    let user: ContractAddress = 0x111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(1, 42);
    stop_cheat_caller_address(lottery_address);

    // Advance time and draw winner
    let (_, end_time, _, _, _, _) = lottery_dispatcher.get_round_info(1);
    start_cheat_block_timestamp(lottery_address, end_time + 1);

    start_cheat_caller_address(lottery_address, test_address());
    lottery_dispatcher.draw_winner(1);
    stop_cheat_caller_address(lottery_address);

    // Check if user is winner
    let (_, is_winner, reward, _) = lottery_dispatcher.get_user_ticket(user, 1);
    if is_winner && reward > 0 {
        // Claim reward
        start_cheat_caller_address(lottery_address, user);
        lottery_dispatcher.claim_reward(1);
        stop_cheat_caller_address(lottery_address);

        // Verify reward was claimed
        let (_, _, _, claimed) = lottery_dispatcher.get_user_ticket(user, 1);
        assert(claimed, 'Reward should be claimed');
    }

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_get_current_round_id() {
    let (lottery_dispatcher, _, _, _, _, _) = setup_test();

    let current_round_id = lottery_dispatcher.get_current_round_id();
    assert(current_round_id == 1, 'Initial round should be 1');
}



#[test]
fn test_buy_ticket_multiple_users() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    let user1: ContractAddress = 0x111.try_into().unwrap();
    let user2: ContractAddress = 0x222.try_into().unwrap();
    let user3: ContractAddress = 0x333.try_into().unwrap();

    setup_user(strk_dispatcher, lottery_address, user1, 10000000000000000000);
    setup_user(strk_dispatcher, lottery_address, user2, 10000000000000000000);
    setup_user(strk_dispatcher, lottery_address, user3, 10000000000000000000);

    // Users buy tickets
    start_cheat_caller_address(lottery_address, user1);
    lottery_dispatcher.buy_ticket(1, 42);
    stop_cheat_caller_address(lottery_address);

    start_cheat_caller_address(lottery_address, user2);
    lottery_dispatcher.buy_ticket(1, 42); // Same guess as user1
    stop_cheat_caller_address(lottery_address);

    start_cheat_caller_address(lottery_address, user3);
    lottery_dispatcher.buy_ticket(1, 25); // Different guess
    stop_cheat_caller_address(lottery_address);

    // Verify round info updated
    let (round_id, end_time, prize_pool, total_tickets, winning_number, is_drawn) = lottery_dispatcher.get_round_info(1);
    assert(round_id == 1, 'Wrong round ID');
    assert(prize_pool == 3000000000000000000, 'Wrong prize pool');
    assert(total_tickets == 3, 'Wrong ticket count');
    assert(!is_drawn, 'Round already drawn');

    // Verify individual tickets
    let (guess1, is_winner1, reward1, claimed1) = lottery_dispatcher.get_user_ticket(user1, 1);
    let (guess2, is_winner2, reward2, claimed2) = lottery_dispatcher.get_user_ticket(user2, 1);
    let (guess3, is_winner3, reward3, claimed3) = lottery_dispatcher.get_user_ticket(user3, 1);

    assert(guess1 == 42, 'Wrong guess1');
    assert(guess2 == 42, 'Wrong guess2');
    assert(guess3 == 25, 'Wrong guess3');

    assert(!is_winner1, 'User1 is winner');
    assert(!is_winner2, 'User2 is winner');
    assert(!is_winner3, 'User3 is winner');

    assert(reward1 == 0, 'User1 has reward');
    assert(reward2 == 0, 'User2 has reward');
    assert(reward3 == 0, 'User3 has reward');

    assert(!claimed1, 'User1 claimed');
    assert(!claimed2, 'User2 claimed');
    assert(!claimed3, 'User3 claimed');
}

#[test]
fn test_draw_winner_with_winners() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    // Setup users
    let user1: ContractAddress = 0x111.try_into().unwrap();
    let user2: ContractAddress = 0x222.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user1, 10000000000000000000);
    setup_user(strk_dispatcher, lottery_address, user2, 10000000000000000000);

    // Buy tickets with same guess
    start_cheat_caller_address(lottery_address, user1);
    lottery_dispatcher.buy_ticket(1, 42);
    stop_cheat_caller_address(lottery_address);

    start_cheat_caller_address(lottery_address, user2);
    lottery_dispatcher.buy_ticket(1, 42);
    stop_cheat_caller_address(lottery_address);

    // Advance time past round end
    let (_, end_time, _, _, _, _) = lottery_dispatcher.get_round_info(1);
    start_cheat_block_timestamp(lottery_address, end_time + 1);

    // Draw winner
    start_cheat_caller_address(lottery_address, test_address());
    lottery_dispatcher.draw_winner(1);
    stop_cheat_caller_address(lottery_address);

    // Verify round was drawn
    let (_, _, _, _, winning_number, is_drawn) = lottery_dispatcher.get_round_info(1);
    assert(is_drawn, 'Round not drawn');
    assert(winning_number >= 10 && winning_number <= 99, 'Invalid winning number');

    // Check if users are winners
    let (_, is_winner1, reward1, _) = lottery_dispatcher.get_user_ticket(user1, 1);
    let (_, is_winner2, reward2, _) = lottery_dispatcher.get_user_ticket(user2, 1);

    if winning_number == 42 {
        // Both users should be winners
        assert(is_winner1, 'User1 not winner');
        assert(is_winner2, 'User2 not winner');
        // After 10% fee: 1.8 STRK remaining, split between 2 winners = 0.9 STRK each
        assert(reward1 == 900000000000000000, 'Wrong reward1');
        assert(reward2 == 900000000000000000, 'Wrong reward2');
    } else {
        // No winners
        assert(!is_winner1, 'User1 is winner');
        assert(!is_winner2, 'User2 is winner');
        assert(reward1 == 0, 'User1 has reward');
        assert(reward2 == 0, 'User2 has reward');
    }

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_claim_reward_success() {
    let (lottery_dispatcher, lottery_address, _, strk_dispatcher, _, _) = setup_test();

    // Setup user
    let user: ContractAddress = 0x111.try_into().unwrap();
    setup_user(strk_dispatcher, lottery_address, user, 10000000000000000000);

    // Buy ticket
    start_cheat_caller_address(lottery_address, user);
    lottery_dispatcher.buy_ticket(1, 42);
    stop_cheat_caller_address(lottery_address);

    // Advance time and draw winner
    let (_, end_time, _, _, _, _) = lottery_dispatcher.get_round_info(1);
    start_cheat_block_timestamp(lottery_address, end_time + 1);

    start_cheat_caller_address(lottery_address, test_address());
    lottery_dispatcher.draw_winner(1);
    stop_cheat_caller_address(lottery_address);

    // Check if user is winner and has reward
    let (_, is_winner, reward, claimed) = lottery_dispatcher.get_user_ticket(user, 1);

    if is_winner && reward > 0 && !claimed {
        // Claim reward
        start_cheat_caller_address(lottery_address, user);
        lottery_dispatcher.claim_reward(1);
        stop_cheat_caller_address(lottery_address);

        // Verify reward was claimed
        let (_, _, _, claimed_after) = lottery_dispatcher.get_user_ticket(user, 1);
        assert(claimed_after, 'Reward should be claimed');
    }

    stop_cheat_block_timestamp(lottery_address);
}

#[test]
fn test_get_accumulated_prize_pool() {
    let (lottery_dispatcher, _, _, _, _, _) = setup_test();

    let accumulated = lottery_dispatcher.get_accumulated_prize_pool();
    assert(accumulated == 0, 'Wrong accumulated');
}

#[test]
fn test_round_info_non_existent() {
    let (lottery_dispatcher, _, _, _, _, _) = setup_test();

    let (round_id, _, _, _, _, _) = lottery_dispatcher.get_round_info(999);
    assert(round_id == 0, 'Wrong round');
}

#[test]
fn test_user_ticket_non_existent() {
    let (lottery_dispatcher, _, _, _, _, _) = setup_test();

    let user: ContractAddress = 0x111.try_into().unwrap();
    let (guess, _, _, _) = lottery_dispatcher.get_user_ticket(user, 1);
    assert(guess == 0, 'Wrong guess');
}
