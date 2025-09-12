import { Link, Outlet } from 'react-router-dom';
import { useAccount } from '@starknet-react/core';

import { ConnectButton } from '../components/connect-button';
import { useStore } from '@/hooks';
import { RootLayoutStore } from './RootLayoutStore';
import { NumberInput } from '@mantine/core';

export function RootLayout() {
  const { store, snapshot } = useStore(RootLayoutStore);
  const { account } = useAccount();

  const isOwner =
    account?.address?.toLowerCase() === (snapshot.owner || '').toLowerCase();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-800 via-black to-gray-600 overflow-hidden">
      {/* Global rich background decoration system - pure blue-purple color scheme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large decorative circles - warm colors */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse animation-delay-4000"></div>

        {/* Medium decorative elements - warm gradients */}
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-orange-400 to-red-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-bounce animation-delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-gradient-to-br from-red-400 to-orange-400 rounded-full mix-blend-multiply filter blur-2xl opacity-22 animate-pulse animation-delay-3000"></div>

        {/* Small decorative dots - warm colors */}
        <div className="absolute top-20 left-20 w-12 h-12 bg-orange-300 rounded-full opacity-35 animate-ping animation-delay-500"></div>
        <div className="absolute top-2/3 right-16 w-8 h-8 bg-red-300 rounded-full opacity-40 animate-ping animation-delay-1500"></div>
        <div className="absolute bottom-16 left-1/3 w-14 h-14 bg-yellow-300 rounded-full opacity-30 animate-ping animation-delay-2500"></div>

        {/* Geometric shape decorations - warm borders */}
        <div
          className="absolute top-1/3 left-16 w-24 h-24 border-2 border-orange-300/25 rotate-45 animate-spin"
          style={{ animationDuration: '18s' }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-20 h-20 border border-red-300/30 rotate-12 animate-spin"
          style={{ animationDuration: '14s', animationDirection: 'reverse' }}
        ></div>
        <div
          className="absolute top-1/6 right-1/6 w-16 h-16 border border-yellow-300/25 rotate-30 animate-spin"
          style={{ animationDuration: '10s' }}
        ></div>

        {/* Dynamic wave effects - warm gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/8 to-transparent animate-pulse animation-delay-5000"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-400/8 to-transparent animate-pulse animation-delay-7000"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/6 to-transparent animate-pulse animation-delay-9000"></div>

        {/* Enhanced particle effects - warm particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full opacity-30 animate-ping ${
                i % 3 === 0
                  ? 'bg-orange-200'
                  : i % 3 === 1
                  ? 'bg-red-200'
                  : 'bg-yellow-200'
              }`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Flowing light effects - warm colors */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div
            className="absolute top-1/4 left-0 w-1/3 h-1 bg-gradient-to-r from-transparent via-orange-300/40 to-transparent animate-pulse"
            style={{ animationDuration: '3s', animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-2/3 right-0 w-1/3 h-1 bg-gradient-to-l from-transparent via-red-300/40 to-transparent animate-pulse"
            style={{ animationDuration: '4s', animationDelay: '2s' }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/2 w-1/4 h-1 bg-gradient-to-r from-transparent via-yellow-300/35 to-transparent animate-pulse"
            style={{ animationDuration: '2.5s', animationDelay: '3s' }}
          ></div>
        </div>
      </div>

      {/* Navigation bar - with background blur effect */}
      <nav className="relative z-20 bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="text-2xl font-bold text-white drop-shadow-lg"
            >
              <img
                className="w-11 h-11 inline-block"
                src="/logo.webp"
                alt="logo"
              />{' '}
              Luck3
            </Link>
            <div className="flex space-x-6">
              <Link
                to="/"
                className="text-white/90 hover:text-white transition-colors font-medium drop-shadow-sm"
              >
                Home
              </Link>
              <Link
                to="/lottery"
                className="text-white/90 hover:text-white transition-colors font-medium drop-shadow-sm"
              >
                Lottery
              </Link>
              <Link
                to="/history"
                className="text-white/90 hover:text-white transition-colors font-medium drop-shadow-sm"
              >
                History
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isOwner && (
              <button
                onClick={() => store.setAdminModalVisible(true)}
                className="text-white/90 hover:text-white transition-colors font-medium drop-shadow-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-md border border-red-400/30"
              >
                ⚙️ Admin
              </button>
            )}
            <a
              href="https://github.com/hstarorg/starknet-lab/tree/main/projects/luck3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white transition-colors font-medium drop-shadow-sm"
            >
              GitHub
            </a>
            <div className="backdrop-blur-sm bg-white/10 rounded-lg p-1">
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Admin Modal */}
      {snapshot.adminModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Admin Panel</h3>
              <button
                onClick={() => store.setAdminModalVisible(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {!snapshot.adminAction ? (
              <div className="space-y-4">
                <button
                  onClick={() => store.setAdminAction('create')}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  🆕 Create New Round
                </button>
                <button
                  onClick={() => store.setAdminAction('draw')}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  🎯 Draw Winner
                </button>
                <button
                  onClick={() => store.setAdminAction('withdraw')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                >
                  💰 Withdraw Funds
                </button>
              </div>
            ) : snapshot.adminAction === 'create' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Round Duration (seconds)
                  </label>
                  <NumberInput
                    value={snapshot.durationSeconds}
                    onChange={(value) =>
                      store.setDurationSeconds(value as number)
                    }
                    placeholder="e.g., 86400 (24 hours)"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => store.setAdminAction(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => store.handleCreateRound(account!)}
                    disabled={
                      snapshot.isProcessing || !snapshot.durationSeconds
                    }
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    {snapshot.isProcessing ? 'Creating...' : 'Create Round'}
                  </button>
                </div>
              </div>
            ) : snapshot.adminAction === 'draw' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Round ID
                  </label>
                  <NumberInput
                    value={snapshot.roundId}
                    onChange={(value) => store.setRoundId(value as number)}
                    placeholder="Enter round ID to draw"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => store.setAdminAction(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => store.handleDrawWinner(account!)}
                    disabled={snapshot.isProcessing || !snapshot.roundId}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    {snapshot.isProcessing ? 'Drawing...' : 'Draw Winner'}
                  </button>
                </div>
              </div>
            ) : snapshot.adminAction === 'withdraw' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Withdrawal Amount (STRK)
                  </label>
                  <NumberInput
                    value={snapshot.withdrawAmount}
                    onChange={(value) =>
                      store.setWithdrawAmount(value as number)
                    }
                    placeholder="Enter amount in STRK"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => store.setAdminAction(null)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => store.handleWithdrawFunds(account!)}
                    disabled={snapshot.isProcessing || !snapshot.withdrawAmount}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    {snapshot.isProcessing
                      ? 'Withdrawing...'
                      : 'Withdraw Funds'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="text-center text-white/70 text-sm py-4">
        © {new Date().getFullYear()} Luck3. All rights reserved.
      </div>
    </div>
  );
}
