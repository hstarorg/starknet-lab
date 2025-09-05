import { Link, Outlet } from 'react-router-dom';
// import { TransactionStatus } from '../components/lottery/TransactionStatus';
import { ConnectButton } from '../components/connect-button';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Luck3
            </Link>
            <div className="flex space-x-6">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/lottery"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Lottery
              </Link>
            </div>
          </div>
          <ConnectButton />
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      {/* <TransactionStatus /> */}
    </div>
  );
}
