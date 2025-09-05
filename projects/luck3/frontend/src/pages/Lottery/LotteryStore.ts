import { proxy } from 'valtio';
import { lotteryService } from '@/services/lottery.service';
import type { CurrentRoundInfo, UserTicket } from '@/types/lottery.type';

type ViewModel = {
  loading?: boolean;
  currentRound?: CurrentRoundInfo;

  purchaseLoading?: boolean;

  userTickets: UserTicket[];
  userTicketsLoading?: boolean;
};

export class LotteryStore {
  state = proxy<ViewModel>({
    userTickets: [],
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

  refresh = () => {
    this.loadData();
  };

  handleBuyTicket = async (guess: number) => {
    // const txHash = await buyTicket(guess);
    // if (txHash) {
    //   // Optional: Add success notification
    // }
  };

  handleClaimReward = async (roundId: bigint) => {
    // const txHash = await claimReward(roundId);
    // if (txHash) {
    //   // Optional: Add success notification
    // }
  };
}
