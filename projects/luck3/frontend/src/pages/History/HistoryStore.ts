import { proxy } from 'valtio';
import { lotteryService } from '@/services/lottery.service';

type ViewModel = {
  roundIds: number[];
  loading?: boolean;
};

export class HistoryStore {
  private readonly ITEMS_PER_PAGE = 10;

  state = proxy<ViewModel>({
    roundIds: [],
  });

  onMounted() {
    console.log('HistoryStore mounted');
    this.loadMoreRounds();
  }

  onUnMounted() {
    // Cleanup if needed
    console.log('HistoryStore unmounted');
  }

  private _getNextPageIds(id: number) {
    const ids: number[] = [];
    for (let max = id; max > Math.max(max - this.ITEMS_PER_PAGE, 0); max--) {
      ids.push(max);
    }
    return ids;
  }

  loadMoreRounds = async () => {
    this.state.loading = true;
    try {
      let maxId: number = 0;
      if (this.state.roundIds.length === 0) {
        // 第一次加载
        const { currentRoundId } = await lotteryService.getInfo();
        maxId = currentRoundId;
      } else {
        // 分页加载
        maxId = this.state.roundIds[this.state.roundIds.length - 1];
      }

      const ids = this._getNextPageIds(maxId);
      this.state.roundIds.push(...ids);
    } catch (error) {
      console.error('Failed to load rounds:', error);
    } finally {
      this.state.loading = false;
    }
  };
}
