import { proxy } from 'valtio';
import { lotteryService } from '@/services/lottery.service';
import type { CurrentRoundInfo, UserTicket } from '@/types/lottery.type';
import type { AccountInterface } from 'starknet';
import { notifications } from '@mantine/notifications';

type ViewModel = {
  loading?: boolean;
  currentRound?: CurrentRoundInfo;

  userTicketLoading?: boolean;
  userTicket?: UserTicket | null;
  userTicketChecked?: boolean;

  purchaseLoading?: boolean;

  recentRounds: RecentRoundInfo[];
  recentRoundsLoading?: boolean;
};

export interface RecentRoundInfo {
  roundId: bigint;
  endTime: bigint;
  prizePool: bigint;
  winningNumber?: number;
  userTicket?: UserTicket | null;
}

export class LotteryStore {
  private account: AccountInterface | null = null;
  private autoRefreshTimer: NodeJS.Timeout | null = null;
  private readonly AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

  state = proxy<ViewModel>({
    recentRounds: [],
  });

  onMounted() {
    this.loadData();
  }

  async loadData() {
    this.state.loading = true;
    try {
      const roundInfo = await lotteryService.getCurrentRoundInfo();
      this.state.currentRound = roundInfo;
    } finally {
      this.state.loading = false;
    }
  }

  setAccount = (account: AccountInterface | null) => {
    // Stop auto-refresh for old account
    this.stopAutoRefresh();

    this.account = account;

    // Start auto-refresh for new account if connected
    if (account?.address) {
      this.startAutoRefresh();
    }
  };

  refresh = () => {
    this.loadData();
  };

  private startAutoRefresh = () => {
    // Clear any existing timer
    this.stopAutoRefresh();

    // Start new auto-refresh timer
    this.autoRefreshTimer = setInterval(async () => {
      try {
        // Only refresh if user is connected
        if (this.account?.address) {
          await this.loadData();
          if (this.state.currentRound) {
            await this.fetchUserTicket();
            // Also refresh recent rounds data
            await this.fetchRecentRounds();
          }
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, this.AUTO_REFRESH_INTERVAL);

    console.log('Auto-refresh started');
  };

  private stopAutoRefresh = () => {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
      console.log('Auto-refresh stopped');
    }
  };

  onUnmounted = () => {
    this.stopAutoRefresh();
  };

  async fetchUserTicket() {
    if (!this.state.currentRound) return;
    this.state.userTicketLoading = true;
    try {
      const userTicket = await lotteryService.getUserTicket(
        this.account?.address || '',
        this.state.currentRound.roundId
      );
      this.state.userTicket = userTicket;
    } finally {
      this.state.userTicketLoading = false;
      this.state.userTicketChecked = true;
    }
  }

  async fetchRecentRounds() {
    if (!this.account?.address) return;

    this.state.recentRoundsLoading = true;
    try {
      const recentRounds: RecentRoundInfo[] = [];

      // Get current round info first
      const currentRound = await lotteryService.getCurrentRoundInfo();

      // Fetch last 3 rounds (current - 1, current - 2, current - 3)
      for (let i = 1; i <= 2; i++) {
        const roundId = currentRound.roundId - BigInt(i);
        if (roundId <= 0n) break;

        try {
          // Get round winning number
          const winningNumber = await lotteryService.getRoundWinningNumber(
            roundId
          );

          // Get user's ticket for this round
          const userTicket = await lotteryService.getUserTicket(
            this.account.address,
            roundId
          );

          // For historical rounds, we can't get the exact prize pool from contract
          // So we estimate it as: ticket count × 1 STRK (since each ticket costs 1 STRK)
          // This is an approximation since we don't have the exact ticket count for historical rounds
          const estimatedPrizePool = userTicket ? 1000000000000000000n : 0n; // 1 STRK if user had ticket

          recentRounds.push({
            roundId,
            endTime: currentRound.endTime - BigInt(i * 24 * 60 * 60), // Approximate end time
            prizePool: estimatedPrizePool,
            winningNumber: winningNumber || undefined,
            userTicket,
          });
        } catch (error) {
          console.error(`Failed to fetch round ${roundId}:`, error);
        }
      }

      this.state.recentRounds = recentRounds;
    } finally {
      this.state.recentRoundsLoading = false;
    }
  }

  handleBuyTicket = async (guess: number) => {
    this.state.purchaseLoading = true;
    try {
      const txHash = await lotteryService.buyTicket(guess, this.account);
      if (txHash) {
        notifications.show({
          message: 'Ticket purchased successfully!',
          color: 'green',
        });
        // 购买成功后刷新用户彩票状态
        await this.fetchUserTicket();
        // 刷新轮次信息以更新票数统计
        await this.loadData();
      }
    } catch (error) {
      notifications.show({
        message: 'Failed to purchase ticket. Please try again.',
        color: 'red',
      });
      console.error('Buy ticket error:', error);
    } finally {
      this.state.purchaseLoading = false;
    }
  };

  handleClaimReward = async (roundId: bigint) => {
    try {
      const txHash = await lotteryService.claimReward(roundId, this.account);
      if (txHash) {
        notifications.show({
          message: 'Reward claimed successfully!',
          color: 'green',
        });
        // 领取奖励后刷新用户彩票状态
        await this.fetchUserTicket();
      }
    } catch (error) {
      notifications.show({
        message: 'Failed to claim reward. Please try again.',
        color: 'red',
      });
      console.error('Claim reward error:', error);
    }
  };
}
