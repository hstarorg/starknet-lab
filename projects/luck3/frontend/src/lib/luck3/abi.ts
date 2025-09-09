export const ABI = [
  {
    "type": "impl",
    "name": "ILotteryImpl",
    "interface_name": "luck3::lottery::IDailyLottery"
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
    "name": "luck3::lottery::IDailyLottery",
    "items": [
      {
        "type": "function",
        "name": "buy_ticket",
        "inputs": [
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
        "name": "get_current_round_info",
        "inputs": [],
        "outputs": [
          {
            "type": "(core::integer::u64, core::integer::u64, core::integer::u256, core::integer::u64)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_user_tickets",
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
            "type": "(core::integer::u8, core::bool)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_user_reward",
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
            "type": "core::integer::u256"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_round_winning_number",
        "inputs": [
          {
            "name": "round_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [
          {
            "type": "core::integer::u8"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "trigger_draw_if_expired",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "draw_rounds_up_to",
        "inputs": [
          {
            "name": "target_round_id",
            "type": "core::integer::u64"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_statistics",
        "inputs": [],
        "outputs": [
          {
            "type": "(core::integer::u64, core::integer::u64, core::integer::u256)"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_rounds_info",
        "inputs": [
          {
            "name": "round_ids",
            "type": "core::array::Array::<core::integer::u64>"
          }
        ],
        "outputs": [
          {
            "type": "core::array::Array::<(core::integer::u64, core::integer::u64, core::integer::u256, core::integer::u64, core::integer::u8, core::bool)>"
          }
        ],
        "state_mutability": "view"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "strk_token",
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
    "name": "luck3::lottery::DailyLottery::TicketBought",
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
    "name": "luck3::lottery::DailyLottery::WinnerDrawn",
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
    "name": "luck3::lottery::DailyLottery::RewardClaimed",
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
    "name": "luck3::lottery::DailyLottery::NewRoundStarted",
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
        "name": "timestamp",
        "type": "core::integer::u64",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "luck3::lottery::DailyLottery::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "TicketBought",
        "type": "luck3::lottery::DailyLottery::TicketBought",
        "kind": "nested"
      },
      {
        "name": "WinnerDrawn",
        "type": "luck3::lottery::DailyLottery::WinnerDrawn",
        "kind": "nested"
      },
      {
        "name": "RewardClaimed",
        "type": "luck3::lottery::DailyLottery::RewardClaimed",
        "kind": "nested"
      },
      {
        "name": "NewRoundStarted",
        "type": "luck3::lottery::DailyLottery::NewRoundStarted",
        "kind": "nested"
      }
    ]
  }
] as const;
