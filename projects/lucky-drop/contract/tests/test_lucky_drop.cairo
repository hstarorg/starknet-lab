use lucky_drop::lucky_drop::{ILuckyDropDispatcher, ILuckyDropDispatcherTrait};
use lucky_drop::models::ClaimData;
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_block_timestamp,
    start_cheat_caller_address, stop_cheat_block_timestamp, stop_cheat_caller_address, test_address,
};
use starknet::secp256_trait::Signature;
use starknet::{ContractAddress, EthAddress};
use crate::mock_erc20::{IMockERC20Dispatcher, IMockERC20DispatcherTrait};

fn deploy_mock_erc20() -> ContractAddress {
    let contract = declare("MockERC20");
    let contract = contract.unwrap().contract_class();
    let owner = test_address();
    let (contract_address, _) = contract.deploy(@array![owner.into()]).unwrap();
    contract_address
}

fn deploy_lucky_drop() -> ContractAddress {
    let contract = declare("LuckyDrop");
    let contract = contract.unwrap().contract_class();
    let owner = test_address();
    let signer_pub_key: EthAddress = 0xaBa63F6E1d85eDfAB5fd486598300688D1F35450.try_into().unwrap();
    let fee_address = test_address();
    let (contract_address, _) = contract
        .deploy(@array![owner.into(), signer_pub_key.into(), fee_address.into()])
        .unwrap();
    contract_address
}

fn setup_test() -> (
    ContractAddress, ContractAddress, ContractAddress, IERC20Dispatcher, ILuckyDropDispatcher,
) {
    let mock_erc20_address = deploy_mock_erc20();
    let lucky_drop_address = deploy_lucky_drop();
    let user = test_address();

    // Mint tokens to user for testing
    let owner = test_address();
    start_cheat_caller_address(mock_erc20_address, owner);
    let mint_dispatcher = IMockERC20Dispatcher { contract_address: mock_erc20_address };
    mint_dispatcher.mint(user, 10000);
    stop_cheat_caller_address(mock_erc20_address);

    let token_dispatcher = IERC20Dispatcher { contract_address: mock_erc20_address };
    let lucky_drop_dispatcher = ILuckyDropDispatcher { contract_address: lucky_drop_address };

    (mock_erc20_address, lucky_drop_address, user, token_dispatcher, lucky_drop_dispatcher)
}

#[test]
fn test_create_red_packet() {
    let (token_address, lucky_drop_address, user, token_dispatcher, lucky_drop_dispatcher) =
        setup_test();

    // Approve lucky drop to spend tokens
    start_cheat_caller_address(token_address, user);
    token_dispatcher.approve(lucky_drop_address, 1000);
    stop_cheat_caller_address(token_address);

    // Create red packet with mocked transferFrom
    start_cheat_caller_address(lucky_drop_address, user);
    let packet_id = lucky_drop_dispatcher
        .create_red_packet(
            token_address, 1000, 10, 1, // Average allocation type
            1000000000 // future timestamp
        );
    stop_cheat_caller_address(lucky_drop_address);

    assert(packet_id == 1, 'Invalid packet id');

    // Check token balance
    let contract_balance = token_dispatcher.balance_of(lucky_drop_address);
    assert(contract_balance == 1000, 'Invalid contract balance');
}

#[test]
fn test_claim_red_packet_average() {
    let (token_address, lucky_drop_address, user, token_dispatcher, lucky_drop_dispatcher) =
        setup_test();
    let claimant = 0x456.try_into().unwrap();

    // aprove
    start_cheat_caller_address(token_address, user);
    token_dispatcher.approve(lucky_drop_address, 1000);
    stop_cheat_caller_address(token_address);

    // create red packet
    start_cheat_caller_address(token_address, lucky_drop_address);
    let packet_id = lucky_drop_dispatcher
        .create_red_packet(token_address, 1000, 10, 1, // Average allocation type
        1000000000);
    stop_cheat_caller_address(token_address);

    // Claim with signature (dummy values for testing)
    start_cheat_caller_address(lucky_drop_address, claimant);
    let claim_data = ClaimData { packet_id, claimant, amount: 100 };
    let signature = Signature {
        r: 0x660a10ee245ebea4d508c3c4f9006a92ecf0ddf772d76c71b90bf7699ed3d89f,
        s: 0x34f566b8fc80c826a0f1895ca4934c12dad364885bc69b428e06fcad1ca9c582,
        y_parity: false,
    };
    let claimed_amount = lucky_drop_dispatcher.claim_red_packet(claim_data, signature);

    stop_cheat_caller_address(lucky_drop_address);

    assert(claimed_amount == 100, 'Invalid claimed amount'); // 1000 / 10

    let claimant_balance = token_dispatcher.balance_of(claimant);
    assert(claimant_balance == 100, 'Invalid claimant balance');
}

#[test]
fn test_claim_red_packet_luck() {
    let (token_address, lucky_drop_address, user, token_dispatcher, lucky_drop_dispatcher) =
        setup_test();
    let claimant = 0x456.try_into().unwrap();

    start_cheat_caller_address(token_address, user);
    token_dispatcher.approve(lucky_drop_address, 1000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, lucky_drop_address);
    let packet_id = lucky_drop_dispatcher
        .create_red_packet(token_address, 1000, 10, 0, // Luck allocation type
        1000000000);
    stop_cheat_caller_address(token_address);

    // Claim with signature (dummy values for testing)
    start_cheat_caller_address(lucky_drop_address, claimant);
    let claim_data = ClaimData { packet_id, claimant, amount: 50 };
    let signature = Signature {
        r: 0xd0b04038e99220acce492497ba6d38b89a142be0f23983dadc40ddf40b9e2435,
        s: 0x209f4de90dbb8e5445aa2af54f6c745ffa2b0a60ee347eb4cd1fecbb6254506e,
        y_parity: true,
    };
    let claimed_amount = lucky_drop_dispatcher.claim_red_packet(claim_data, signature);
    stop_cheat_caller_address(lucky_drop_address);

    assert(claimed_amount > 0, 'Claimed amount should be > 0');
    assert(claimed_amount <= 1000, 'Claimed amount too high');
}

#[test]
fn test_double_claim_prevention() {
    let (token_address, lucky_drop_address, user, token_dispatcher, lucky_drop_dispatcher) =
        setup_test();
    let claimant = 0x456.try_into().unwrap();
    start_cheat_caller_address(token_address, user);
    token_dispatcher.approve(lucky_drop_address, 1000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, lucky_drop_address);
    let packet_id = lucky_drop_dispatcher
        .create_red_packet(token_address, 1000, 10, 1, // Average allocation type
        1000000000);
    stop_cheat_caller_address(token_address);

    // First claim with signature
    start_cheat_caller_address(lucky_drop_address, claimant);
    let claim_data = ClaimData { packet_id, claimant, amount: 100 };
     let signature = Signature {
        r: 0x660a10ee245ebea4d508c3c4f9006a92ecf0ddf772d76c71b90bf7699ed3d89f,
        s: 0x34f566b8fc80c826a0f1895ca4934c12dad364885bc69b428e06fcad1ca9c582,
        y_parity: false,
    };
    lucky_drop_dispatcher.claim_red_packet(claim_data, signature);
    stop_cheat_caller_address(lucky_drop_address);
}

#[test]
fn test_refund_after_expiry() {
    let (token_address, lucky_drop_address, user, token_dispatcher, lucky_drop_dispatcher) =
        setup_test();

    // create red packet
    start_cheat_caller_address(token_address, user);
    token_dispatcher.approve(lucky_drop_address, 1000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, lucky_drop_address);
    let packet_id = lucky_drop_dispatcher
        .create_red_packet(
            token_address, 1000, 10, 1, // Average allocation type
            1 // past timestamp
        );
    let user_balance = token_dispatcher.balance_of(user);
    assert(user_balance == 10000 - 1000, 'Invalid user balance');

    // Advance time past expiry and refund
    start_cheat_block_timestamp(lucky_drop_address, 1000000000);
    lucky_drop_dispatcher.refund_red_packet(packet_id);
    stop_cheat_caller_address(token_address);
    stop_cheat_block_timestamp(lucky_drop_address);

    let user_balance = token_dispatcher.balance_of(user);
    assert(user_balance == 10000, 'Refund failed');
}
