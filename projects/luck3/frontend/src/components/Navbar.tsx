import { Link } from 'react-router-dom';
import { ConnectButton } from './connect-button';

export function Navbar() {
  return (
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
  );
}
