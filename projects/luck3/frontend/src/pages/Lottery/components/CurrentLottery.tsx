import { useEffect, useState } from 'react';
import {
  ClockIcon,
  TicketIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface LotteryHeaderProps {
  roundId: number;
  endTime: number;
  prizePool?: string;
  totalTickets: number;
  loading?: boolean;
}

export function CurrentLottery({
  roundId,
  endTime,
  prizePool,
  totalTickets,
  loading,
}: LotteryHeaderProps) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const endDate = new Date(Number(endTime) * 1000);
      const now = new Date();

      if (endDate > now) {
        setCountdown(formatDistanceToNow(endDate, { addSuffix: true }));
      } else {
        setCountdown('Round ended');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <RocketLaunchIcon className="h-8 w-8 text-purple-200" />
          </div>
          <div className="text-3xl font-bold">{Number(roundId)}</div>
          <div className="text-purple-200 text-sm">Current Round</div>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <ClockIcon className="h-8 w-8 text-blue-200" />
          </div>
          <div className="text-2xl font-bold">{countdown}</div>
          <div className="text-blue-200 text-sm">Time Remaining</div>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <CurrencyDollarIcon className="h-8 w-8 text-green-200" />
          </div>
          <div className="text-3xl font-bold">{prizePool}</div>
          <div className="text-green-200 text-sm">Prize Pool (STRK)</div>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <TicketIcon className="h-8 w-8 text-yellow-200" />
          </div>
          <div className="text-3xl font-bold">{Number(totalTickets)}</div>
          <div className="text-yellow-200 text-sm">Total Tickets</div>
        </div>
      </div>
    </div>
  );
}
