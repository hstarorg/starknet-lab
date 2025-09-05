import { LotteryHeader } from './components/LotteryHeader';
import { TicketPurchase } from './components/TicketPurchase';
import { MyTickets } from './components/MyTickets';
import { useStore } from '../../hooks';
import { LotteryStore } from './LotteryStore';
import { useAccount } from '@starknet-react/core';

export function Lottery() {
  const { store, snapshot } = useStore(LotteryStore);
  const { address } = useAccount();

  const currentRound = snapshot.currentRound;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Lottery</h1>
        <p className="text-lg text-gray-600">
          Guess a number <strong>10 - 99</strong> and win STRK tokens in our
          daily lottery!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LotteryHeader
            roundId={currentRound?.roundId || 0n}
            endTime={currentRound?.endTime || 0n}
            prizePool={currentRound?.prizePool || 0n}
            totalTickets={currentRound?.totalTickets || 0n}
            loading={snapshot.loading}
          />

          <TicketPurchase
            onBuyTicket={store.handleBuyTicket}
            purchaseLoading={snapshot.purchaseLoading}
            disabled={!currentRound || snapshot.loading}
            isConnected={!!address}
          />
        </div>

        <div className="lg:col-span-1">
          <MyTickets
            userTickets={snapshot.userTickets}
            loading={snapshot.userTicketsLoading}
            onClaimReward={store.handleClaimReward}
          />
        </div>
      </div>
    </div>
  );
}
