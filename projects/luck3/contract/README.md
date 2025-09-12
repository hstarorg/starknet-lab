# Luck3 Smart Contract

This directory contains the Cairo smart contract for the Luck3 lottery application.

## 📋 Contract Overview

The `SimpleLottery` contract implements a decentralized lottery system with the following features:

- **Round Management**: Owner-controlled round creation with custom duration
- **Ticket System**: STRK-based ticket purchasing with number guessing (10-99)
- **Winner Selection**: Block-based random number generation for fair draws
- **Reward Distribution**: Automatic prize pool splitting among winners
- **Accumulated Prize Pool**: Unclaimed prizes roll over to future rounds
- **Fee System**: 10% platform fee collection

## 🔧 Development Commands

### Build Contract

```bash
scarb build
```

### Run Tests

```bash
scarb test
snforge test  # Integration tests
```

### Format Code

```bash
scarb fmt
```

## 🚀 Deployment

### Prerequisites

- Starkli CLI installed and configured
- Starknet account with STRK tokens
- Environment variables set in `.env`

### Deploy Steps

1. **Declare the contract class**

   ```bash
   source .env && starkli declare target/dev/luck3_SimpleLottery.contract_class.json --network=sepolia
   ```

2. **Deploy the contract**

   ```bash
   starkli deploy <CLASS_HASH> <OWNER> <STRK_TOKEN_ADDRESS> <FEE_ADDRESS> --network=sepolia
   ```

   Example:

   ```bash
   starkli deploy 0x017884d5b585a6fbddda5acc99778ba800130d5d00c8ea32a47ac5ff69305f4d 0x05B46E1237b1Ad38293e3E962cb922Cdf8CD29011D22EeAFb7A5f367363a6De0 0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D 0x05B46E1237b1Ad38293e3E962cb922Cdf8CD29011D22EeAFb7A5f367363a6De0 --network=sepolia
   ```

## 🔗 Contract Interaction

### Read Functions

```bash
# Get round information
starkli call <CONTRACT_ADDRESS> get_round_info <ROUND_ID> --network=sepolia

# Get user ticket for a specific round
starkli call <CONTRACT_ADDRESS> get_user_ticket <USER_ADDRESS> <ROUND_ID> --network=sepolia

# Get contract info (owner, current round, accumulated prize pool)
starkli call <CONTRACT_ADDRESS> get_info --network=sepolia
```

### Write Functions

```bash
# Create a new round (300 seconds = 5 minutes)
starkli invoke <CONTRACT_ADDRESS> create_round 300 --network=sepolia

# Buy a lottery ticket for round 1 (guess number 42)
starkli invoke <CONTRACT_ADDRESS> buy_ticket 1 42 --network=sepolia

# Draw winner for round 1
starkli invoke <CONTRACT_ADDRESS> draw_winner 1 --network=sepolia

# Claim reward for round 1
starkli invoke <CONTRACT_ADDRESS> claim_reward 1 --network=sepolia

# Withdraw from accumulated prize pool (100 STRK)
starkli invoke <CONTRACT_ADDRESS> withdraw_accumulated_prize_pool 100000000000000000000 --network=sepolia
```

## 📊 Contract Constants

- **TICKET_COST**: 1 STRK (10^18 wei)
- **MIN_GUESS**: 10
- **MAX_GUESS**: 99
- **PLATFORM_FEE**: 10% of prize pool
- **STRK_TOKEN_ADDRESS**: 0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D (Mainnet)

## 🔧 Generate ABI

```bash
starkli class-at <CONTRACT_ADDRESS> --network=sepolia | pnpx abi-wan-kanabi --input /dev/stdin --output abi.ts
```

Example:

```bash
starkli class-at "0x007e18ff94d1654244e913cec63310a65b30bcde3fdd5803b48ca81135604cf2" --network=sepolia | pnpx abi-wan-kanabi --input /dev/stdin --output abi.ts
```

## 📋 Recent Deployments

| Date             | Network         | Class Hash                                                         | Contract Address                                                   |
| ---------------- | --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 2025-09-05       | Sepolia Testnet | 0x0710a6cc43ac842642eb4b5a541ee4631b53259460364366868b35dc07744810 | 0x061bfe2f84e7c8c5c1b35bd8aa6e1135b5a0554f1aedf051e222c1bf3548e321 |
| 2025-09-08       | Sepolia Testnet | 0x04b1d234be63c96a162f1084dd6b38c6684fa437bd6845cfacbca27da73c1e57 | 0x049a6282c3337ca1f3c425acfd57c4c7cc90b85c942945746b73871538587720 |
| 2025-09-08 23:46 | Sepolia Testnet | 0x07e59af4b19a69e794bf8c33854506e76b3ae5e5ff4b6f1a142d174b0c49673e | 0x01c3a075f5a914672e428e1be3f61ef32e3cc530e53b848547ce4c6971eacc11 |
| 2025-09-09 22:21 | Sepolia Testnet | 0x00110860772a602217e4f90304e60fd66c7a2e7729a921ab9b8f510beb720e94 | 0x04c97a706683dbf0f0d7738f78d6cc9422b73e16f1005ceb1e52f8d639ad4e82 |
| 2025-09-11 23:37 | Sepolia Testnet | 0x01d3226781b0317266ca33a883c2765eeed50bbbab00ee2bc2ccedf4a3cc5d9b | 0x00e6330efe390c914bfd65925c70e830b7c7ced6c5d3566ac11f4a7954c842b0 |
| 2025-09-12 00:52 | Sepolia Testnet | 0x054ae3f7aa35754930462ed99994ed8731c6a5077a3f8b371f116952c4743260 | 0x05d9dc9ebcfb490694c17bb15a7874a22b6dc52d1214a9a15a2747d01a07b6d9 |
| 2025-09-12 01:13 | Sepolia Testnet | 0x066b3ca9288ffa97fbcc5f7bb267b9e0e87ac028cfba60472547391e3de4a6cc | 0x05a774d217b4f673f5a9ea4273f05c7e5711da7022bcf63d7fe446517b877cd4 |
| 2025-09-12 12:01 | Sepolia Testnet | 0x0611ac55df5b855d8318f83bce5ca67386fbfd863a3461a713100883e1d74163 | 0x007e18ff94d1654244e913cec63310a65b30bcde3fdd5803b48ca81135604cf2 |
| 2025-09-12 17:25 | Sepolia Testnet | 0x04f4c6050846acadf4ee5f88ada8ad331cdaf8414f49419de3ab3182614b3f10 | 0x01ba6d03c36c0598c8b86df77c166477761adc1afc9a7f63e88736677fe390b1 |
| 2025-09-12 22:21 | Sepolia Testnet | 0x017884d5b585a6fbddda5acc99778ba800130d5d00c8ea32a47ac5ff69305f4d | 0x03ad7e3f11c962f14fdefe2c1b26f8240c109c63d80e7f8e42eb59635524245a |
| 2025-09-12 22:35 | Mainnet         | 0x017884d5b585a6fbddda5acc99778ba800130d5d00c8ea32a47ac5ff69305f4d | 0x06f764b6999f5003c4b7b5fe25004e8d552b4d4d0c4c814ddd32e602d2376a4f |

## 🏗️ Contract Architecture

### Core Components

- **Round Management**: Owner-controlled round creation with custom durations
- **Ticket System**: STRK-based ticket purchases with number guessing (10-99)
- **Winner Selection**: Block-based random number generation using block info and timestamps
- **Reward System**: Automatic prize distribution with accumulated prize pool rollover
- **Fee Collection**: 10% platform fee extraction to designated fee address
- **Accumulated Prize Pool**: Unclaimed prizes roll over to future rounds

### Events

- `TicketBought`: Emitted when a ticket is purchased (user, round_id, guess, timestamp)
- `WinnerDrawn`: Emitted when winners are selected (round_id, winning_number, prize_pool, winner_count, reward_per_winner, timestamp)
- `RewardClaimed`: Emitted when rewards are claimed (user, round_id, amount, timestamp)
- `RoundCreated`: Emitted when a new round begins (round_id, start_time, end_time, timestamp)

For more details about the contract logic, see the main [project README](../README.md).
