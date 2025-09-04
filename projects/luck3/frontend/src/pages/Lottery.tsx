import { LotteryHeader } from '../components/lottery/LotteryHeader';
import { TicketPurchase } from '../components/lottery/TicketPurchase';
import { MyTickets } from '../components/lottery/MyTickets';
import { useLottery } from '../hooks/useLottery';

export function Lottery() {
  const {
    currentRound,
    loading,
    error,
    buyTicket,
    claimReward,
    refresh
  } = useLottery();

  const handleBuyTicket = async (guess: number) => {
    const txHash = await buyTicket(guess);
    if (txHash) {
      // Optional: Add success notification
    }
  };

  const handleClaimReward = async (roundId: bigint) => {
    const txHash = await claimReward(roundId);
    if (txHash) {
      // Optional: Add success notification
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Lottery</h1>
        <p className="text-lg text-gray-600">
          Guess a number 0-99 and win STRK tokens in our daily lottery!
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error.message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LotteryHeader
            roundId={currentRound?.roundId || 0n}
            endTime={currentRound?.endTime || 0n}
            prizePool={currentRound?.prizePool || 0n}
            totalTickets={currentRound?.totalTickets || 0n}
            loading={loading}
          />

          <TicketPurchase
            onSuccess={refresh}
            disabled={!currentRound || loading}
          />
        </div>

        <div className="lg:col-span-1">
          <MyTickets
            onClaimReward={handleClaimReward}
          />
        </div>
      </div>
    </div>
  );
}