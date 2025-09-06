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

  setAccount = (account: AccountInterface) => {
    this.account = account;
  };

  refresh = () => {
    this.loadData();
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
      for (let i = 1; i <= 3; i++) {
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

          recentRounds.push({
            roundId,
            endTime: currentRound.endTime - BigInt(i * 24 * 60 * 60), // Approximate end time
            prizePool: 0n, // TODO: Get actual prize pool from contract
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
    const txHash = await lotteryService.buyTicket(guess, this.account);
    if (txHash) {
      notifications.show({
        message: 'Ticket purchased successfully!',
        color: 'green',
      });
    }
  };

  handleClaimReward = async (roundId: bigint) => {
    // const txHash = await claimReward(roundId);
    // if (txHash) {
    //   // Optional: Add success notification
    // }
  };
}
