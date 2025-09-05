import { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import type { UserTicket } from '../../../services/types';

interface MyTicketsProps {
  onClaimReward?: (roundId: bigint) => void;
  userTickets: readonly UserTicket[];
  loading?: boolean;
}

export function MyTickets({
  userTickets,
  onClaimReward,
  loading,
}: MyTicketsProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'won' | 'all'>(
    'active'
  );

  const formatSTRK = (amount: bigint) => {
    return (Number(amount) / 1e18).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });
  };

  const getStatusColor = (ticket: UserTicket) => {
    if (ticket.isWinner && !ticket.claimed) return 'bg-green-50 text-green-800';
    if (ticket.isWinner && ticket.claimed) return 'bg-blue-50 text-blue-800';
    if (!ticket.isWinner) return 'bg-gray-50 text-gray-800';
    return 'bg-yellow-50 text-yellow-800';
  };

  const getStatusIcon = (ticket: UserTicket) => {
    if (ticket.isWinner && !ticket.claimed)
      return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />;
    if (ticket.isWinner && ticket.claimed)
      return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
    return <XCircleIcon className="h-5 w-5 text-gray-500" />;
  };

  const getStatusText = (ticket: UserTicket) => {
    if (ticket.isWinner && !ticket.claimed) return 'Won - Claim Reward';
    if (ticket.isWinner && ticket.claimed) return 'Won - Claimed';
    return 'Not a winner';
  };

  const filteredTickets = userTickets.filter((ticket) => {
    switch (activeTab) {
      case 'active':
        return !ticket.isWinner || (ticket.isWinner && !ticket.claimed);
      case 'won':
        return ticket.isWinner;
      case 'all':
        return true;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded mb-3"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">My Tickets</h3>

        <div className="flex space-x-2">
          {['active', 'won', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                activeTab === tab
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {userTickets.length === 0 ? (
        <div className="text-center py-8">
          <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No tickets purchased yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Buy your first ticket to participate!
          </p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No {activeTab} tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.roundId.toString()}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                ticket.isWinner && !ticket.claimed
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">{getStatusIcon(ticket)}</div>
                <div>
                  <p className="font-medium text-gray-900">
                    Round #{ticket.roundId.toString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Your guess:{' '}
                    <span className="font-bold text-purple-600">
                      {ticket.guess}
                    </span>
                  </p>
                  <p
                    className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${getStatusColor(
                      ticket
                    )}`}
                  >
                    {getStatusText(ticket)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {ticket.isWinner && !ticket.claimed && (
                  <button
                    onClick={() => onClaimReward?.(ticket.roundId)}
                    className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Claim {formatSTRK(ticket.reward)} STRK
                  </button>
                )}

                {ticket.isWinner && ticket.claimed && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      Won {formatSTRK(ticket.reward)} STRK
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>
          Showing {filteredTickets.length} of {userTickets.length} tickets
        </p>
      </div>
    </div>
  );
}
