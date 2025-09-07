import { TicketPurchase } from './components/TicketPurchase';
import { CurrentLottery } from './components/CurrentLottery';
import { TicketItem } from './components/TicketItem';
import { RecentLottery } from './components/RecentLottery';
import { useStore } from '@/hooks';
import { LotteryStore } from './LotteryStore';
import { useAccount } from '@starknet-react/core';
import { AppConf } from '@/constants';
import { useEffect } from 'react';
import { LoadingArea } from '@/components/loading-area';

export function Lottery() {
  const { store, snapshot } = useStore(LotteryStore);
  const { address, account } = useAccount();
  const LOTTERY_CONFIG = AppConf.LOTTERY_CONFIG;

  store.setAccount(account!);
  const currentRound = snapshot.currentRound;

  useEffect(() => {
    if (account?.address && currentRound?.roundId) {
      store.fetchUserTicket();
      store.fetchRecentRounds();
    }
  }, [store, account?.address, currentRound?.roundId]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Daily Lottery</h1>
        <p className="text-lg text-gray-300">
          Guess a number{' '}
          <strong>
            {LOTTERY_CONFIG.minGuess} - {LOTTERY_CONFIG.maxGuess}
          </strong>{' '}
          and win STRK tokens in our daily lottery!
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-2">
          <CurrentLottery
            roundId={currentRound?.roundId || 0n}
            endTime={currentRound?.endTime || 0n}
            prizePool={currentRound?.prizePool || 0n}
            totalTickets={currentRound?.totalTickets || 0n}
            loading={snapshot.loading}
          />
          <LoadingArea
            loading={snapshot.userTicketLoading}
            loaded={snapshot.userTicketChecked}
            className="mt-4 min-h-[200px]"
          >
            {snapshot.userTicket ? (
              <TicketItem
                ticket={snapshot.userTicket}
                onClaimReward={store.handleClaimReward}
                isCurrentRound={true}
              />
            ) : (
              <TicketPurchase
                currentRound={currentRound}
                onBuyTicket={store.handleBuyTicket}
                purchaseLoading={snapshot.purchaseLoading}
                disabled={!currentRound || snapshot.loading}
                isConnected={!!address}
              />
            )}
          </LoadingArea>
        </div>
        <div className="flex-1">
          <RecentLottery />
        </div>
      </div>
    </div>
  );
}
