use starknet::ContractAddress;

/// Data structure for red packet claims
#[derive(Drop, Serde)]
pub struct ClaimData {
    pub packet_id: u256,
    pub claimant: ContractAddress,
    pub amount: u256,
}


/// Information about a red packet (immutable fields)
#[derive(Drop, Serde, starknet::Store)]
pub struct RedPacketInfo {
    pub creator: ContractAddress,
    pub token: ContractAddress,
    pub total_amount: u256,
    pub num_packets: u32,
    pub allocation_type: u8,
    pub start: u64,
    pub expiry: u64,
}
