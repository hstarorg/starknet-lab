use core::poseidon::poseidon_hash_span;
use lucky_drop::models::ClaimData;
use starknet::eth_address::EthAddress;
use starknet::eth_signature::verify_eth_signature;
use starknet::secp256_trait::{Signature, signature_from_vrs};

fn hash_claim_message(claim_data: ClaimData) -> felt252 {
    let mut data = ArrayTrait::<felt252>::new();
    data.append(claim_data.packet_id.low.into());
    data.append(claim_data.packet_id.high.into());
    data.append(claim_data.claimant.into());
    data.append(claim_data.amount.low.into());
    data.append(claim_data.amount.high.into());

    // hash
    poseidon_hash_span(data.span())
}

#[test]
fn test_hash_claim_message_function() {
    // Test inputs
    let packet_id = 1_u256;
    let claimant = 0x111111.try_into().unwrap();
    let amount = 100_u256;

    // Compute expected hash
    let expected: felt252 = 0x040f777918e76f630f82ec081cfbb3236430c759fcaf0a1bd9b543fd4912d526
        .try_into()
        .unwrap();

    let claim_data = ClaimData { packet_id: packet_id, claimant: claimant, amount: amount };

    // Call the contract function
    let result = hash_claim_message(claim_data);

    assert_eq!(result, expected);
}


#[test]
fn test_verify_message_function() {
    let msg_hash = 0x0d52783c4cbad7ebaf7eb943fc648f5282a52070442fc18d8dd16ddb2fcbaf66_u256;
    let eth_signer: EthAddress = 0xaBa63F6E1d85eDfAB5fd486598300688D1F35450.try_into().unwrap();

    let signature: Signature = Signature {
        r: 0x8a916108410c4508e1293816f4bf65aacaf2948ce6d78583dcb50fc00aedbe44_u256,
        s: 0x2d65f42c3b26444d51aec3affc26fcafe746a8f0532541bfc93327c177344073_u256,
        y_parity: true // y_parity: false == v: 27 == recovery_id: 0
    };

    // 你的这个检查很好，确认了 v=27 被正确解析
    let s2: Signature = signature_from_vrs(
        28_u32,
        r: 0x8a916108410c4508e1293816f4bf65aacaf2948ce6d78583dcb50fc00aedbe44_u256,
        s: 0x2d65f42c3b26444d51aec3affc26fcafe746a8f0532541bfc93327c177344073_u256,
    );
    assert_eq!(signature, s2);

    // 【1. 执行调用】
    verify_eth_signature(msg_hash, signature, eth_signer);
    assert(true, 'Test reached end');
}
