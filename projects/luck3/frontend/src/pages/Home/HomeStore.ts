import { lotteryService } from '@/services/lottery.service';
import type { CurrentRoundInfo } from '@/types/lottery.type';
import { formatDistanceToNow } from 'date-fns';
import { proxy } from 'valtio';

type ViewModel = {
  currentRound?: CurrentRoundInfo;
  timeRemaining?: string;
  statistics?: {
    totalRounds: bigint;
    totalParticipants: bigint;
    totalPrizePool: bigint;
  };
};
export class HomeStore {
  state = proxy<ViewModel>({});
  private _intervalId: NodeJS.Timeout | null = null;
  constructor() {
    this._intervalId = setInterval(() => {
      this._tick();
    }, 1000);
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
    try {
      const [round, statistics] = await Promise.all([
        lotteryService.getCurrentRoundInfo(),
        lotteryService.getStatistics(),
      ]);
      this.state.currentRound = round;
      this.state.statistics = statistics;
    } catch (error) {
      console.error('Failed to load home data:', error);
      // Still try to load current round info even if statistics fail
      try {
        const round = await lotteryService.getCurrentRoundInfo();
        this.state.currentRound = round;
      } catch (roundError) {
        console.error('Failed to load current round info:', roundError);
      }
    }
  }

  private _updateTimeRemaining() {
    if (!this.state.currentRound) return;
    const endTime = this.state.currentRound.endTime;
    this.state.timeRemaining = formatDistanceToNow(
      new Date(Number(endTime) * 1000),
      {
        addSuffix: true,
      }
    );
  }

  private _tick() {
    console.log('HomeStore tick');
    this._updateTimeRemaining();
  }
}
