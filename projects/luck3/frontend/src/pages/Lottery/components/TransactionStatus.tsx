import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLottery } from '../../hooks/useLottery';
import type { LotteryTransaction } from '../../lib/contract/types';

export function TransactionStatus() {
  const { transactions } = useLottery();

  // Monitor transaction status
  useEffect(() => {
    const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
    
    if (pendingTransactions.length === 0) return;

    // Here you would typically set up a polling mechanism or use webhooks
    // For now, we'll just log them
    console.log('Monitoring transactions:', pendingTransactions);
  }, [transactions]);

  const getStatusIcon = (status: LotteryTransaction['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: LotteryTransaction['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200';
    }
  };

  const getTransactionMessage = (tx: LotteryTransaction) => {
    switch (tx.type) {
      case 'buy_ticket':
        return `Buying ticket with guess ${tx.guess}`;
      case 'claim_reward':
        return `Claiming reward for round ${tx.roundId}`;
      case 'trigger_draw':
        return 'Triggering round draw';
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (transactions.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 w-80 max-h-96 overflow-y-auto z-50">
      <div className="space-y-2">
        {transactions.slice(-5).map((tx) => (
          <div
            key={tx.hash}
            className={`p-3 rounded-lg border ${getStatusColor(tx.status)} shadow-sm`}
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-0.5">{getStatusIcon(tx.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{getTransactionMessage(tx)}</p>
                <p className="text-xs text-gray-600">
                  {formatAddress(tx.hash)}
                </p>
                {tx.error && (
                  <p className="text-xs text-red-600 mt-1">{tx.error}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}