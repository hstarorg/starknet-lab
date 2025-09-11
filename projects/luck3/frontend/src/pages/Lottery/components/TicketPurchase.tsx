import { useState } from 'react';
import { NumberInput } from '@mantine/core';
import {
  ArrowRightIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { randomInt } from '@/utils';
import { AppConf } from '@/constants';
import type { RoundInfo } from '@/lib/luck3/Luck3ContractClient';

interface TicketPurchaseProps {
  onBuyTicket?: (roundId: number, guess: number) => void;
  disabled?: boolean;
  isConnected?: boolean;
  currentRound?: RoundInfo;
  purchaseLoading?: boolean;
}

export function TicketPurchase({
  onBuyTicket,
  disabled,
  isConnected,
  currentRound,
  purchaseLoading,
}: TicketPurchaseProps) {
  const LOTTERY_CONFIG = AppConf.LOTTERY_CONFIG;

  const [guess, setGuess] = useState(
    randomInt(LOTTERY_CONFIG.minGuess, LOTTERY_CONFIG.maxGuess)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onBuyTicket?.(Number(currentRound!.id), Number(guess));
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
            <NumberInput
              min={LOTTERY_CONFIG.minGuess}
              max={LOTTERY_CONFIG.maxGuess}
              step={1}
              value={guess}
              placeholder="Enter a number for guess"
              onChange={(v) => setGuess(v as number)}
              disabled={disabled || purchaseLoading}
            />
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
    </div>
  );
}
