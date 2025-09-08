# Luck3 - Lottery on Starknet

🎰 **Luck3** is a decentralized lottery application built on the Starknet blockchain. Players can purchase lottery tickets by guessing numbers between 10-99, with each ticket costing 1 STRK token. Winners share the prize pool based on correct guesses, with all transactions and draws happening transparently on-chain.

## 🌟 Features

- **🎯 Daily Fair Draws**: Automatic lottery draws every 5 minutes using blockchain-based randomness
- **🔒 Secure & Transparent**: Built with Cairo smart contracts on Starknet - every transaction is verifiable
- **⚡ Instant Rewards**: Winners can claim STRK rewards immediately after draws
- **💰 Low Entry Cost**: Only 1 STRK per ticket makes it accessible to everyone
- **🎲 Simple Gameplay**: Guess a number between 10-99 and win big
- **📊 Real-time Stats**: Live tracking of prize pools, participants, and time remaining
- **🔗 Wallet Integration**: Seamless connection with Starknet wallets

## 🏗️ Architecture

### Smart Contract (Cairo)

- **Location**: `projects/luck3/contract/`
- **Framework**: Starknet Foundry (Scarb)
- **Features**:
  - Round management with automatic expiration handling
  - Ticket purchasing with STRK token payments
  - Winner selection using timestamp-based randomness
  - Reward claiming system
  - 10% platform fee distribution

### Frontend (React + TypeScript)

- **Location**: `projects/luck3/frontend/`
- **Tech Stack**:
  - React 19 with TypeScript
  - Vite for build tooling
  - Tailwind CSS for styling
  - Starknet React for blockchain integration
  - React Router for navigation
- **Features**:
  - Modern, responsive UI with animated backgrounds
  - Real-time lottery statistics
  - Wallet connection interface
  - Ticket purchasing flow
  - Reward claiming interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm package manager
- Starknet wallet (ArgentX, Braavos, etc.)
- STRK tokens for playing

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/hstarorg/starknet-lab.git
   cd projects/luck3
   ```

2. **Install dependencies**

   ```bash
   cd frontend
   pnpm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**

   ```bash
   pnpm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎮 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and select your Starknet wallet
2. **Buy Tickets**: Choose a number between 10-99 and purchase for 1 STRK
3. **Wait for Draw**: Draws happen automatically every 5 minutes
4. **Claim Rewards**: If your number matches the winning number, claim your share!

### Game Rules

- **Ticket Price**: 1 STRK per ticket
- **Number Range**: 10-99 (inclusive)
- **Round Duration**: 5 minutes
- **Prize Distribution**: Winners split 90% of the prize pool (10% goes to platform)
- **Multiple Winners**: If multiple players guess correctly, the prize is split equally

## 📋 Contract Deployment

### Prerequisites

- Starkli CLI installed
- Starknet account configured
- STRK tokens for deployment

### Deploy Steps

1. **Build the contract**

   ```bash
   cd contract
   scarb build
   ```

2. **Declare the contract**

   ```bash
   source .env && starkli declare target/dev/luck3_DailyLottery.contract_class.json --network=sepolia
   ```

3. **Deploy the contract**
   ```bash
   starkli deploy <CLASS_HASH> <STRK_TOKEN_ADDRESS> <FEE_ADDRESS> --network=sepolia
   ```

### Contract Interaction

```bash
# Get current round info
starkli call <CONTRACT_ADDRESS> get_current_round_info --network=sepolia

# Buy a ticket (invoke)
starkli invoke <CONTRACT_ADDRESS> buy_ticket 42 --network=sepolia

# Claim reward (invoke)
starkli invoke <CONTRACT_ADDRESS> claim_reward 1 --network=sepolia
```

## 🛠️ Development

### Frontend Development

```bash
cd frontend
pnpm run dev      # Start dev server
pnpm run build    # Build for production
pnpm run preview  # Preview production build
pnpm run lint     # Run ESLint
```

### Contract Development

```bash
cd contract
scarb build              # Build contract
scarb test              # Run tests
scarb fmt               # Format code
snforge test            # Run integration tests
```

### Project Structure

```
projects/luck3/
├── contract/                 # Cairo smart contract
│   ├── src/
│   │   └── lottery.cairo    # Main contract logic
│   ├── tests/               # Contract tests
│   └── Scarb.toml          # Scarb configuration
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── layouts/       # Layout components
│   │   ├── lib/           # Contract clients
│   │   └── constants/     # App configuration
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Frontend Environment Variables

```env
VITE_STARKNET_CHAIN=sepolia
VITE_CONTRACT_ADDRESS=0x...
VITE_STRK_ADDRESS=0x...
```

### Contract Constants

- **ROUND_DURATION**: 300 seconds (5 minutes)
- **TICKET_COST**: 1 STRK (10^18 wei)
- **GUESS_RANGE**: 10-99
- **PLATFORM_FEE**: 10% of prize pool

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## ⚠️ Disclaimer

This is a demo application for educational purposes. Please be aware that:

- Lottery games involve risk of loss
- Smart contracts may contain bugs
- Test on testnet before mainnet deployment
- Always verify contract addresses

## 🔗 Links

- **GitHub Repository**: [https://github.com/hstarorg/starknet-lab](https://github.com/hstarorg/starknet-lab)
- **Starknet Documentation**: [https://docs.starknet.io](https://docs.starknet.io)
- **Cairo Documentation**: [https://book.cairo-lang.org](https://book.cairo-lang.org)

---

**Built with ❤️ on Starknet**
