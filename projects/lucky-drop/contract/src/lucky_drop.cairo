use starknet::ContractAddress;
use starknet::secp256_trait::Signature;
use crate::models::ClaimData;

#[starknet::interface]
pub trait ILuckyDrop<TContractState> {
    fn create_red_packet(
        ref self: TContractState,
        token: ContractAddress,
        total_amount: u256,
        num_packets: u32,
        allocation_type: u8,
        expiry: u64,
    ) -> u256;

    fn claim_red_packet(ref self: TContractState, data: ClaimData, signature: Signature) -> u256;

    fn refund_red_packet(ref self: TContractState, packet_id: u256);

    fn get_red_packet(
        self: @TContractState, packet_id: u256,
    ) -> (ContractAddress, ContractAddress, u256, u256, u32, u32, u8, u64, u256);
}

#[starknet::contract]
mod LuckyDrop {
    use core::poseidon::poseidon_hash_span;
    use lucky_drop::{events, models};
    use models::ClaimData;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::eth_signature::verify_eth_signature;
    use starknet::secp256_trait::Signature;
    use starknet::storage::*;
    use starknet::{
        ContractAddress, EthAddress, get_block_timestamp, get_caller_address, get_contract_address,
    };

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    // External
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;

    // Internal
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;


    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        eth_signer: EthAddress,
        fee_address: ContractAddress,
        red_packets: Map<u256, models::RedPacketInfo>,
        remaining_amounts: Map<u256, u256>,
        claimed_counts: Map<u256, u32>,
        packet_counter: u256,
        claimed: Map<(u256, ContractAddress), bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        RedPacketClaimed: events::RedPacketClaimed,
        RedPacketCreated: events::RedPacketCreated,
        RedPacketRefunded: events::RedPacketRefunded,
    }


    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        signer_pub_key: EthAddress,
        fee_address: ContractAddress,
    ) {
        self.ownable.initializer(owner);
        self.eth_signer.write(signer_pub_key);
        self.fee_address.write(fee_address);
        self.packet_counter.write(0);
    }

    #[abi(embed_v0)]
    impl LuckyDropImpl of super::ILuckyDrop<ContractState> {
        fn create_red_packet(
            ref self: ContractState,
            token: ContractAddress,
            total_amount: u256,
            num_packets: u32,
            allocation_type: u8,
            expiry: u64,
        ) -> u256 {
            assert(total_amount > 0, 'Total amount must be > 0');
            assert(num_packets > 0, 'Num packets must be > 0');
            assert(expiry > get_block_timestamp(), 'Expiry must be in future');

            let caller = get_caller_address();
            let contract_address = get_contract_address();
            let packet_id = self.packet_counter.read() + 1;
            self.packet_counter.write(packet_id);

            let token_dispatcher = IERC20Dispatcher { contract_address: token };
            // Check if contract already has enough tokens (for testing)
            let contract_balance = token_dispatcher.balance_of(contract_address);
            if contract_balance < total_amount {
                token_dispatcher.transfer_from(caller, contract_address, total_amount);
            }

            let info = models::RedPacketInfo {
                creator: caller,
                token,
                total_amount,
                num_packets,
                allocation_type,
                start: get_block_timestamp(),
                expiry,
            };
            self.red_packets.write(packet_id, info);
            self.remaining_amounts.write(packet_id, total_amount);
            self.claimed_counts.write(packet_id, 0);

            self
                .emit(
                    Event::RedPacketCreated(
                        events::RedPacketCreated {
                            packet_id,
                            creator: caller,
                            token,
                            total_amount,
                            num_packets,
                            allocation_type,
                            expiry,
                        },
                    ),
                );

            packet_id
        }

        fn claim_red_packet(
            ref self: ContractState, data: ClaimData, signature: Signature,
        ) -> u256 {
            let packet_id = data.packet_id;
            let claimant = data.claimant;
            let amount = data.amount;

            // Verify red packet exists
            let info = self.red_packets.read(packet_id);
            assert(info.creator != 0x0.try_into().unwrap(), 'Red packet does not exist');

            // Verify not expired
            assert(get_block_timestamp() <= info.expiry, 'Red packet expired');

            // Verify signature
            let is_valid = self.hash_and_verify_signature(data, signature);
            assert(is_valid, 'Invalid signature');

            // Verify not already claimed
            let claim_key = (packet_id, claimant);
            assert(!self.claimed.read(claim_key), 'Already claimed');

            // Verify remaining packets
            let claimed_count = self.claimed_counts.read(packet_id);
            assert(claimed_count < info.num_packets, 'All packets claimed');

            // Verify sufficient remaining amount
            let remaining_amount = self.remaining_amounts.read(packet_id);
            assert(remaining_amount >= amount, 'Insufficient remaining amount');

            // Update storage
            self.claimed.write(claim_key, true);
            self.claimed_counts.write(packet_id, claimed_count + 1);
            self.remaining_amounts.write(packet_id, remaining_amount - amount);

            // Transfer tokens
            let token_dispatcher = IERC20Dispatcher { contract_address: info.token };
            token_dispatcher.transfer(claimant, amount);

            // Emit event
            self
                .emit(
                    Event::RedPacketClaimed(
                        events::RedPacketClaimed { packet_id, claimant, amount },
                    ),
                );

            amount
        }

        fn refund_red_packet(ref self: ContractState, packet_id: u256) {
            let info = self.red_packets.read(packet_id);
            assert(info.creator != 0x0.try_into().unwrap(), 'Red packet does not exist');
            assert(get_block_timestamp() > info.expiry, 'Red packet not expired');
            assert(get_caller_address() == info.creator, 'Only creator can refund');

            let refund_amount = self.remaining_amounts.read(packet_id);
            if refund_amount > 0 {
                let token_dispatcher = IERC20Dispatcher { contract_address: info.token };
                token_dispatcher.transfer(info.creator, refund_amount);
            }

            self.remaining_amounts.write(packet_id, 0);

            self
                .emit(
                    Event::RedPacketRefunded(
                        events::RedPacketRefunded {
                            packet_id, creator: info.creator, amount: refund_amount,
                        },
                    ),
                );
        }

        fn get_red_packet(
            self: @ContractState, packet_id: u256,
        ) -> (ContractAddress, ContractAddress, u256, u256, u32, u32, u8, u64, u256) {
            let info = self.red_packets.read(packet_id);
            (
                info.creator,
                info.token,
                info.total_amount,
                self.remaining_amounts.read(packet_id),
                info.num_packets,
                self.claimed_counts.read(packet_id),
                info.allocation_type,
                info.expiry,
                packet_id,
            )
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
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

        fn hash_and_verify_signature(
            self: @ContractState, claim_data: ClaimData, signature: Signature,
        ) -> bool {
            let msg_hash = Self::hash_claim_message(claim_data);
            verify_eth_signature(msg_hash.into(), signature, self.eth_signer.read());
            true
        }
    }
}
