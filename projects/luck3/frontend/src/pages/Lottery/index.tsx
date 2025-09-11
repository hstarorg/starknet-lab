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

  const currentRound = snapshot.currentRound;

  // Handle account changes
  useEffect(() => {
    store.setAccount(account || null);
  }, [store, account]);

  // Handle initial data loading when account is connected
  useEffect(() => {
    if (account?.address && currentRound?.id) {
      store.fetchUserTicket();
      store.fetchRecentRounds();
    }
  }, [store, account?.address, currentRound?.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Lottery</h1>
        <p className="text-lg text-gray-300">
          Guess a number{' '}
          <strong>
            {LOTTERY_CONFIG.minGuess} - {LOTTERY_CONFIG.maxGuess}
          </strong>{' '}
          and win STRK tokens in our lottery!
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-2">
          <CurrentLottery
            roundId={currentRound?.id || 0}
            endTime={currentRound?.endTime || 0}
            prizePool={currentRound?.prizePool}
            totalTickets={currentRound?.totalTickets || 0}
            loading={snapshot.loading}
          />
          {!address ? (
            <div className="mt-4 bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-gray-500 mb-4">
                <div className="text-lg font-medium mb-2">
                  Connect Your Wallet
                </div>
                <div className="text-sm">
                  Please connect your wallet to participate in the lottery
                </div>
              </div>
            </div>
          ) : (
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
                  currentRound={currentRound!}
                  onBuyTicket={store.handleBuyTicket}
                  purchaseLoading={snapshot.purchaseLoading}
                  disabled={!currentRound || snapshot.loading}
                  isConnected={!!address}
                />
              )}
            </LoadingArea>
          )}
        </div>
        <div className="flex-1">
          <RecentLottery
            recentRoundsLoading={snapshot.recentRoundsLoading}
            recentRounds={snapshot.recentRounds}
          />
        </div>
      </div>
    </div>
  );
}
