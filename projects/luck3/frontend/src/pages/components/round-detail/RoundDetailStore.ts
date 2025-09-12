import { proxy } from 'valtio';
import { lotteryService } from '@/services/lottery.service';
import type { LotteryRoundDetail } from '@/types/lottery.type';
import { getUnixTimestamp } from '@/utils';

type ViewModel = {
  round?: LotteryRoundDetail;
  loading?: boolean;
};

export class RoundDetailStore {
  state = proxy<ViewModel>({});

  onMounted() {}

  loadRoundInfo = async (roundId: number, userAddress?: string) => {
    this.state.loading = true;
    try {
      const round = (await lotteryService.getRoundInfo(
        roundId
      )) as LotteryRoundDetail;
      if (round && userAddress) {
        const userTicket = await lotteryService.getUserTicket(
          userAddress,
          roundId
        );
        round.userTicket = userTicket!;
      }
      round.roundStatus = this._getRoundStatus(round);

      this.state.round = round;
    } finally {
      this.state.loading = false;
    }
  };

  private _getRoundStatus = (round: LotteryRoundDetail) => {
    if (round.isDrawn) {
      return { status: 'completed', color: 'green', text: 'Completed' };
    }
    const unixNow = getUnixTimestamp();
    const ended = unixNow > round.endTime;
    if (ended) {
      // Check if round has participants
      const hasParticipants = round.totalTickets
        ? round.totalTickets > 0
        : Number(round.prizePool) > 0;
      if (hasParticipants) {
        return { status: 'drawing', color: 'orange', text: 'Drawing' };
      } else {
        return { status: 'expired', color: 'gray', text: 'Expired' };
      }
    }
    return { status: 'active', color: 'blue', text: 'Active' };
  };

  onUnMounted() {
    // Cleanup if needed
    console.log('HistoryStore unmounted');
  }
}
