import { proxy } from 'valtio';
import { lotteryService } from '@/services/lottery.service';
import type { UserTicket } from '@/types/lottery.type';
import type { AccountInterface } from 'starknet';

export interface HistoryRound {
  roundId: bigint;
  endTime: bigint;
  prizePool: bigint;
  totalTickets: bigint;
  winningNumber?: number;
  userTicket?: UserTicket | null;
}

type ViewModel = {
  rounds: HistoryRound[];
  loading?: boolean;
  hasMore: boolean;
  minRoundId: number | null;
};

export class HistoryStore {
  private readonly ITEMS_PER_PAGE = 10;

  private account: AccountInterface | null = null;

  state = proxy<ViewModel>({
    rounds: [],
    hasMore: true,
    minRoundId: null,
  });

  setAccount = (account: AccountInterface) => {
    this.account = account;
  };

  onMounted() {
    console.log('HistoryStore mounted');
    // Don't load data immediately, will be called from component with user address
  }

  onUnMounted() {
    // Cleanup if needed
    console.log('HistoryStore unmounted');
  }

  async loadMoreRounds(userAddress?: string) {
    if (!this.state.hasMore) return;

    this.state.loading = true;
    try {
      // Get current round info to determine the starting point
      const currentRoundInfo = await lotteryService.getCurrentRoundInfo();
      const currentRoundId = Number(currentRoundInfo!.id);

      // Initialize minRoundId if not set
      if (this.state.minRoundId === null) {
        this.state.minRoundId = currentRoundId + 1;
      }

      // Prepare round IDs for batch query
      const roundIds: number[] = [];
      let tempRoundId = this.state.minRoundId;

      // Load ITEMS_PER_PAGE rounds backwards
      for (let i = 0; i < this.ITEMS_PER_PAGE; i++) {
        tempRoundId -= 1;
        if (tempRoundId <= 0) {
          break;
        }
        roundIds.push(tempRoundId);
      }

      if (roundIds.length === 0) {
        this.state.hasMore = false;
        return;
      }

      // Use batch query to get rounds info
      const roundsInfo = await lotteryService.getRoundsInfoBatch(roundIds);

      // Get user tickets for these rounds
      const userTickets = await lotteryService.getUserTicketsBatch(
        userAddress || '',
        roundIds
      );

      // Build history rounds data
      const newRounds: HistoryRound[] = roundsInfo.map((roundInfo, index) => ({
        roundId: roundInfo.roundId,
        endTime: roundInfo.endTime,
        prizePool: roundInfo.prizePool,
        totalTickets: roundInfo.totalTickets,
        winningNumber: roundInfo.winningNumber || undefined,
        userTicket: userTickets[index],
      }));

      // Update state
      this.state.rounds.push(...newRounds);
      this.state.minRoundId = tempRoundId;

      // Check if we've reached the end
      if (tempRoundId <= 1) {
        this.state.hasMore = false;
      }
    } catch (error) {
      console.error('Failed to load rounds:', error);
    } finally {
      this.state.loading = false;
    }
  }

  async claimReward(roundId: number) {
    lotteryService.claimReward(roundId, this.account as AccountInterface);
  }
}
