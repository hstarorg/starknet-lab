import { Link } from 'react-router-dom'
import { WalletIcon } from '@heroicons/react/24/outline'

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Luck3 Lottery
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
        
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <WalletIcon className="w-5 h-5" />
          <span>Connect Wallet</span>
        </button>
      </div>
    </nav>
  )
}