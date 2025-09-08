import { proxy } from 'valtio';
import { lotteryService } from '@/services/lottery.service';
import type { LotteryRound } from '@/types/lottery.type';

export interface HistoryRound extends LotteryRound {
  winnerCount?: number;
  rewardPerWinner?: bigint;
}

type ViewModel = {
  rounds: HistoryRound[];
  loading?: boolean;
  hasMore: boolean;
  minRoundId: number | null;
};

export class HistoryStore {
  private readonly ITEMS_PER_PAGE = 2;

  state = proxy<ViewModel>({
    rounds: [],
    hasMore: true,
    minRoundId: null,
  });

  onMounted() {
    console.log('HistoryStore mounted');
    this.loadMoreRounds();
  }

  async loadMoreRounds() {
    if (!this.state.hasMore) return;

    this.state.loading = true;
    try {
      if (!this.state.minRoundId) {
        const currentRoundInfo = await lotteryService.getCurrentRoundInfo();
        this.state.minRoundId = Number(currentRoundInfo.roundId) + 1;
      }

      const newRounds: HistoryRound[] = [];
      let tempRoundId = this.state.minRoundId;

      // Load exactly ITEMS_PER_PAGE rounds backwards from startRoundId
      for (let i = 1; i <= this.ITEMS_PER_PAGE; i++) {
        tempRoundId -= 1;
        if (tempRoundId <= 0) {
          continue;
        }
        try {
          const winningNumber = await lotteryService.getRoundWinningNumber(
            BigInt(tempRoundId)
          );
          // This round has been drawn
          newRounds.push({
            id: BigInt(tempRoundId),
            startTime: 0n,
            endTime: 0n,
            prizePool: 0n,
            winningNumber: winningNumber || 0,
            isDrawn: true,
          });
        } catch {
          // Round might not exist or not drawn yet
          console.log(`Round ${tempRoundId} not available`);
        }
      }
      if (tempRoundId <= 1) {
        this.state.hasMore = false;
      }

      this.state.rounds.push(...newRounds);
      this.state.minRoundId = tempRoundId;
    } catch (error) {
      console.error('Failed to load rounds:', error);
    } finally {
      this.state.loading = false;
    }
  }
}
