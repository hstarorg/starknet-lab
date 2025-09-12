export const ABI = [
  {
    "type": "impl",
    "name": "SimpleLotteryImpl",
    "interface_name": "luck3::simple_lottery::ISimpleLottery"
  },
  {
    "type": "struct",
    "name": "core::integer::u256",
    "members": [
      {
        "name": "low",
        "type": "core::integer::u128"
      },
      {
        "name": "high",
        "type": "core::integer::u128"
      }
    ]
  },
  {
    "type": "enum",
    "name": "core::bool",
    "variants": [
      {
        "name": "False",
        "type": "()"
      },
      {
        "name": "True",
        "type": "()"
      }
    ]
  },
  {
    "type": "interface",
    "name": "luck3::simple_lottery::ISimpleLottery",
    "items": [
      {
        "type": "function",
        "name": "buy_ticket",
        "inputs": [
          {
            "name": "round_id",
            "type": "core::integer::u64"
          },
          {
            "name": "guess",
            "type": "core::integer::u8"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "claim_reward",
        "inputs": [
          {
            "name": "round_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "create_round",
        "inputs": [
          {
            "name": "duration_seconds",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "draw_winner",
        "inputs": [
          {
            "name": "round_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_round_info",
        "inputs": [
          {
            "name": "round_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "(core::integer::u64, core::integer::u64, core::integer::u64, core::integer::u256, core::integer::u8, core::bool, core::integer::u64)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_user_ticket",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          },
          {
            "name": "round_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "(core::integer::u8, core::bool, core::integer::u256, core::bool)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_info",
        "inputs": [],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::integer::u64, core::integer::u256)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "withdraw_accumulated_prize_pool",
        "inputs": [
          {
            "name": "amount",
            "type": "core::integer::u256"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "strk_token_address",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "fee_address",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ]
  },
  {
    "type": "event",
    "name": "luck3::simple_lottery::SimpleLottery::TicketBought",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "round_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "guess",
        "type": "core::integer::u8",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "luck3::simple_lottery::SimpleLottery::WinnerDrawn",
    "kind": "struct",
    "members": [
      {
        "name": "round_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "winning_number",
        "type": "core::integer::u8",
        "kind": "data"
      },
      {
        "name": "prize_pool",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "winner_count",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "reward_per_winner",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "luck3::simple_lottery::SimpleLottery::RewardClaimed",
    "kind": "struct",
    "members": [
      {
        "name": "user",
        "type": "core::starknet::contract_address::ContractAddress",
        "kind": "data"
      },
      {
        "name": "round_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "amount",
        "type": "core::integer::u256",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "luck3::simple_lottery::SimpleLottery::RoundCreated",
    "kind": "struct",
    "members": [
      {
        "name": "round_id",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "start_time",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "end_time",
        "type": "core::integer::u64",
        "kind": "data"
      },
      {
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "luck3::simple_lottery::SimpleLottery::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "TicketBought",
        "type": "luck3::simple_lottery::SimpleLottery::TicketBought",
        "kind": "nested"
      },
      {
        "name": "WinnerDrawn",
        "type": "luck3::simple_lottery::SimpleLottery::WinnerDrawn",
        "kind": "nested"
      },
      {
        "name": "RewardClaimed",
        "type": "luck3::simple_lottery::SimpleLottery::RewardClaimed",
        "kind": "nested"
      },
      {
        "name": "RoundCreated",
        "type": "luck3::simple_lottery::SimpleLottery::RoundCreated",
        "kind": "nested"
      }
    ]
  }
] as const;
