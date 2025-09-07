# Luck3 Frontend

This directory contains the React frontend application for the Luck3 daily lottery dApp.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
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
│   │   └── Lottery/       # Lottery gameplay page
│   ├── lib/               # Contract clients and utilities
│   │   ├── luck3/         # Luck3 contract client
│   │   ├── erc20/         # ERC20 token client
│   │   └── kanabi.ts      # ABI utilities
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
VITE_STARKNET_CHAIN=sepolia

# Contract addresses
VITE_CONTRACT_ADDRESS=0x049a6282c3337ca1f3c425acfd57c4c7cc90b85c942945746b73871538587720
VITE_STRK_ADDRESS=0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D

# Optional: Fee address
VITE_FEE_ADDRESS=0x05B46E1237b1Ad38293e3E962cb922Cdf8CD29011D22EeAFb7A5f367363a6De0
```

### Lottery Configuration
Key settings are defined in `src/constants/index.ts`:
- **Number Range**: 10-99
- **Ticket Price**: 1 STRK
- **Round Duration**: 5 minutes

## 🎨 UI Features

- **Responsive Design**: Works on desktop and mobile devices
- **Animated Backgrounds**: Dynamic particle effects and gradients
- **Real-time Updates**: Live lottery statistics and countdown timers
- **Wallet Integration**: Seamless connection with Starknet wallets
- **Modern UI**: Glassmorphism effects with backdrop blur
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
