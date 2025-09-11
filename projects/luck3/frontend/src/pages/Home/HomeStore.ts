import { formatDistanceToNow } from 'date-fns';
import { proxy } from 'valtio';

import { lotteryService } from '@/services/lottery.service';
import type { LotteryRound } from '@/types/lottery.type';

type ViewModel = {
  currentRound?: LotteryRound | null;
  timeRemaining?: string;
  accumulatedPrizePool?: string;
  isLoading?: boolean;
  totalRounds?: number;
};
export class HomeStore {
  state = proxy<ViewModel>({});
  private _intervalId: NodeJS.Timeout | null = null;
  constructor() {
    this._intervalId = setInterval(() => {
      this._tick();
    }, 10000);
  }

  onMounted() {
    this.loadData();
  }
  onUnmounted() {
    if (this._intervalId) {
      globalThis.clearInterval(this._intervalId);
    }
  }

  async loadData() {
    this.state.isLoading = true;
    try {
      const info = await lotteryService.getInfo();
      const round = await lotteryService.getRoundInfo(info.currentRoundId);
      this.state.totalRounds = info.currentRoundId;
      this.state.currentRound = round;
      this.state.accumulatedPrizePool = info.accumulatedPrizePool;
      if (round) {
        this.state.timeRemaining = formatDistanceToNow(
          new Date(Number(round.endTime) * 1000),
          {
            addSuffix: true,
          }
        );
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  private _tick() {
    this.loadData();
  }
}
