import { Link, Outlet } from 'react-router-dom';
import { ConnectButton } from '../components/connect-button';

export function RootLayout() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-violet-900 overflow-hidden">
      {/* Global rich background decoration system - pure blue-purple color scheme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large decorative circles - pure blue-purple colors */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse animation-delay-4000"></div>

        {/* Medium decorative elements - blue-purple gradients */}
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-bounce animation-delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-22 animate-pulse animation-delay-3000"></div>

        {/* Small decorative dots - pure blue-purple */}
        <div className="absolute top-20 left-20 w-12 h-12 bg-purple-300 rounded-full opacity-35 animate-ping animation-delay-500"></div>
        <div className="absolute top-2/3 right-16 w-8 h-8 bg-blue-300 rounded-full opacity-40 animate-ping animation-delay-1500"></div>
        <div className="absolute bottom-16 left-1/3 w-14 h-14 bg-violet-300 rounded-full opacity-30 animate-ping animation-delay-2500"></div>

        {/* Geometric shape decorations - blue-purple borders */}
        <div
          className="absolute top-1/3 left-16 w-24 h-24 border-2 border-purple-300/25 rotate-45 animate-spin"
          style={{ animationDuration: '18s' }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-20 h-20 border border-blue-300/30 rotate-12 animate-spin"
          style={{ animationDuration: '14s', animationDirection: 'reverse' }}
        ></div>
        <div
          className="absolute top-1/6 right-1/6 w-16 h-16 border border-violet-300/25 rotate-30 animate-spin"
          style={{ animationDuration: '10s' }}
        ></div>

        {/* Dynamic wave effects - blue-purple gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/8 to-transparent animate-pulse animation-delay-5000"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/8 to-transparent animate-pulse animation-delay-7000"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-violet-400/6 to-transparent animate-pulse animation-delay-9000"></div>

        {/* Enhanced particle effects - blue-purple particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 rounded-full opacity-30 animate-ping ${
                i % 3 === 0
                  ? 'bg-purple-200'
                  : i % 3 === 1
                  ? 'bg-blue-200'
                  : 'bg-violet-200'
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

        {/* Flowing light effects - pure blue-purple */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div
            className="absolute top-1/4 left-0 w-1/3 h-1 bg-gradient-to-r from-transparent via-purple-300/40 to-transparent animate-pulse"
            style={{ animationDuration: '3s', animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-2/3 right-0 w-1/3 h-1 bg-gradient-to-l from-transparent via-blue-300/40 to-transparent animate-pulse"
            style={{ animationDuration: '4s', animationDelay: '2s' }}
          ></div>
          <div
            className="absolute bottom-1/4 left-1/2 w-1/4 h-1 bg-gradient-to-r from-transparent via-violet-300/35 to-transparent animate-pulse"
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
            </div>
          </div>
          <div className="backdrop-blur-sm bg-white/10 rounded-lg p-1">
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="relative z-10 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <div className="text-center text-white/70 text-sm py-4">
        © {new Date().getFullYear()} Luck3. All rights reserved.
      </div>
    </div>
  );
}
