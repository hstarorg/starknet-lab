import { useStore } from '@/hooks';
import { HistoryStore } from './HistoryStore';

export function History() {
  const { store, snapshot } = useStore(HistoryStore);

  const { rounds, loading, hasMore } = snapshot;

  const formatRoundId = (id: bigint) => {
    return `#${id.toString().padStart(4, '0')}`;
  };

  const formatPrizePool = (amount: bigint) => {
    return `${(Number(amount) / 1e18).toFixed(2)} STRK`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Lottery History</h1>
        <p className="text-white/70">View all completed lottery rounds</p>
      </div>

      <div className="space-y-4">
        {rounds.map((round) => (
          <div
            key={round.id.toString()}
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {formatRoundId(round.id)}
                </h3>
                <p className="text-white/60 text-sm">Completed</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">
                  {round.winningNumber}
                </div>
                <p className="text-white/60 text-sm">Winning Number</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Prize Pool:</span>
                <span className="text-white ml-2">
                  {round.prizePool ? formatPrizePool(round.prizePool) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-white/60">Winners:</span>
                <span className="text-white ml-2">
                  {round.winnerCount || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => store.loadMoreRounds()}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            {loading ? 'Loading...' : 'Load More Rounds'}
          </button>
        </div>
      )}

      {!hasMore && rounds.length > 0 && (
        <div className="text-center mt-8 text-white/60">
          No more rounds to load
        </div>
      )}

      {rounds.length === 0 && !loading && (
        <div className="text-center mt-16">
          <p className="text-white/60 text-lg">
            No lottery history available yet
          </p>
        </div>
      )}
    </div>
  );
}
