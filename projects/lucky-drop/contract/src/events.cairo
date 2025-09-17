use starknet::ContractAddress;

#[derive(Drop, starknet::Event)]
pub struct RedPacketCreated {
    pub packet_id: u256,
    pub creator: ContractAddress,
    pub token: ContractAddress,
    pub total_amount: u256,
    pub num_packets: u32,
    pub allocation_type: u8, // Simplified to u8
    pub expiry: u64,
}

#[derive(Drop, starknet::Event)]
pub struct RedPacketClaimed {
    pub packet_id: u256,
    pub claimant: ContractAddress,
    pub amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct RedPacketRefunded {
    pub packet_id: u256,
    pub creator: ContractAddress,
    pub amount: u256,
}
