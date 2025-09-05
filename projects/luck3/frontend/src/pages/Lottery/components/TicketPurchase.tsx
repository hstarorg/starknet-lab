import { useState } from 'react';
import {
  ArrowRightIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import type { CurrentRoundInfo } from '../../../services/types';

interface TicketPurchaseProps {
  onBuyTicket?: (guess: number) => void;
  disabled?: boolean;
  isConnected?: boolean;
  currentRound?: CurrentRoundInfo;
  purchaseLoading?: boolean;
}

export function TicketPurchase({
  onBuyTicket,
  disabled,
  isConnected,
  currentRound,
  purchaseLoading,
}: TicketPurchaseProps) {
  const [guess, setGuess] = useState('');

  const handleGuessChange = (value: string) => {
    // Only allow numbers 0-99
    const num = parseInt(value);
    if (value === '' || (Number.isInteger(num) && num >= 10 && num <= 99)) {
      setGuess(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onBuyTicket?.(Number(guess));
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-gray-500 mb-4">
          Please connect your wallet to participate in the lottery
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Buy Lottery Ticket
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="guess"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Choose your lucky number (10-99)
          </label>
          <div className="relative">
            <input
              type="number"
              id="guess"
              value={guess}
              onChange={(e) => handleGuessChange(e.target.value)}
              min="0"
              max="99"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg text-center"
              placeholder="00"
              disabled={disabled || purchaseLoading}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 text-sm">
                {guess ? String(parseInt(guess)).padStart(2, '0') : '--'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Ticket Price: 1 STRK</span>
          </div>
          <div className="text-sm text-gray-500">
            {currentRound
              ? `${currentRound.totalTickets} tickets sold`
              : 'Loading...'}
          </div>
        </div>

        <button
          type="submit"
          disabled={!guess || disabled || purchaseLoading}
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {purchaseLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              Buy Ticket
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>⚡ Powered by Starknet • Fair & Transparent</p>
      </div>
    </div>
  );
}
