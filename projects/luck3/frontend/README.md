# Luck3 Frontend

This directory contains the React frontend application for the Luck3 lottery dApp.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm package manager

### Installation
```bash
# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 🛠️ Tech Stack

- **React 19** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Starknet React** - Blockchain integration library
- **React Router** - Client-side routing
- **Valtio** - Lightweight state management
- **Mantine** - Component library for enhanced UI

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── connect-button/ # Wallet connection component
│   │   ├── loading-area/   # Loading states
│   │   └── ...
│   ├── layouts/            # Page layouts
│   │   └── RootLayout.tsx  # Main app layout with navigation
│   ├── pages/              # Page components
│   │   ├── Home/          # Landing page
│   │   ├── Lottery/       # Lottery gameplay page
│   │   ├── History/       # Lottery history page
│   │   └── components/    # Shared page components
│   │       └── round-detail/ # Round detail component
│   ├── lib/               # Contract clients and utilities
│   │   ├── luck3/         # Luck3 contract client
│   │   ├── erc20/         # ERC20 token client
│   ├── providers/         # React context providers
│   │   └── StarknetProvider.tsx
│   ├── hooks/             # Custom React hooks
│   ├── constants/         # App configuration
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── styles/            # Global styles
├── public/                # Static assets
├── index.html            # HTML template
└── package.json          # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Starknet network configuration
VITE_APP_ENV=development
VITE_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_8
VITE_LUCK3_CONTRACT_ADDRESS=0x01ba6d03c36c0598c8b86df77c166477761adc1afc9a7f63e88736677fe390b1
```

### Lottery Configuration
Key settings are defined in `src/constants/index.ts`:
- **Number Range**: 10-99
- **Ticket Price**: 1 STRK

## 📱 Pages & Features

### Home Page
- **Hero Section**: Eye-catching title with STRK token integration
- **Live Statistics**: Real-time display of current round data, prize pool, tickets sold, and participants
- **Statistics Overview**: Historical data including total rounds and accumulated prize pools
- **Feature Showcase**: Highlighting daily fair draws, secure blockchain integration, and instant rewards
- **How to Play**: Step-by-step guide with interactive numbered circles

### Lottery Page
- **Current Round Display**: Shows active lottery details with countdown timer
- **Ticket Purchase**: Interactive form for buying lottery tickets
- **User Tickets**: Display of purchased tickets with winner status
- **Recent Rounds**: Quick view of past lottery results

### History Page
- **Round Grid**: Responsive grid layout showing historical lottery rounds
- **Equal Height Cards**: All round detail cards maintain consistent height
- **Detailed Information**: Each card shows round number, date, winning number, prize pool, and user participation
- **Action Buttons**: Claim reward functionality for winners

### Shared Components
- **RoundDetail**: Reusable component for displaying lottery round information
- **ConnectButton**: Wallet connection interface
- **LoadingArea**: Consistent loading states across the application

## 🎨 UI Features

- **Responsive Design**: Works on desktop and mobile devices
- **Animated Backgrounds**: Dynamic particle effects and gradients with warm color themes
- **Real-time Updates**: Live lottery statistics and countdown timers
- **Wallet Integration**: Seamless connection with Starknet wallets
- **Modern UI**: Glassmorphism effects with backdrop blur and orange-themed design
- **Gamified Experience**: Interactive hover effects, smooth animations, and engaging visuals
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔧 Development Scripts

```bash
# Development
pnpm run dev          # Start dev server with hot reload
pnpm run build        # Build for production
pnpm run preview      # Preview production build locally
pnpm run lint         # Run ESLint for code quality

# Type checking
pnpm run type-check   # Run TypeScript type checking
```

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm run test

# Run tests with coverage
pnpm run test:coverage
```

## 📦 Build & Deployment

### Production Build
```bash
pnpm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Deployment Options
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag & drop dist folder or connect via Git
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **IPFS**: For decentralized hosting

## 🔧 ESLint Configuration

The project includes comprehensive ESLint configuration for code quality:

### Type-Aware Rules (Recommended for Production)
```js
// eslint.config.js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

### React-Specific Rules
```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

## 🚀 Performance Optimizations

- **Vite**: Fast development and optimized production builds
- **Code Splitting**: Automatic route-based code splitting
- **Asset Optimization**: Image optimization and font loading
- **Bundle Analysis**: Analyze bundle size with build tools

## 🔗 Integration

The frontend integrates with:
- **Luck3 Smart Contract**: For lottery operations
- **STRK Token Contract**: For ticket payments
- **Starknet Wallets**: ArgentX, Braavos, etc.
- **Starknet Network**: Sepolia testnet and mainnet

For more details about the overall project, see the main [project README](../README.md).
