import { lotteryService } from '@/services/lottery.service';
import { notifications } from '@mantine/notifications';
import type { AccountInterface } from 'starknet';
import { proxy } from 'valtio';

type ViewModel = {
  adminModalOpen?: boolean;
  owner?: string;
  adminAction?: 'create' | 'draw' | null;
  isProcessing?: boolean;
  durationSeconds: number;
  roundId?: number;
};
export class RootLayoutStore {
  state = proxy<ViewModel>({ durationSeconds: 86400 });
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
    console.log('RootLayoutStore unmounted');
    if (this._intervalId) {
      globalThis.clearInterval(this._intervalId);
    }
  }

  async loadData() {
    const info = await lotteryService.getInfo();
    this.state.owner = info.owner;
  }

  setAdminModalVisible = (open: boolean) => {
    this.state.adminModalOpen = open;
  };

  setAdminAction = (action: 'create' | 'draw' | null) => {
    this.state.adminAction = action;
  };

  handleCreateRound = async (account: AccountInterface) => {
    this.state.isProcessing = true;
    try {
      await lotteryService.createRound(
        BigInt(this.state.durationSeconds),
        account as AccountInterface
      );
      this.setAdminModalVisible(false);
      alert('Round created successfully!');
    } catch (error) {
      console.error('Failed to create round:', error);
      alert('Failed to create round. Check console for details.');
    } finally {
      this.state.isProcessing = false;
    }
  };

  setDurationSeconds = (value: number) => {
    this.state.durationSeconds = value;
  };

  setRoundId = (value: number) => {
    this.state.roundId = value;
  };

  handleDrawWinner = async (account: AccountInterface) => {
    if (!this.state.roundId) {
      return notifications.show({
        title: 'Error',
        message: 'Please select a round to draw a winner.',
      });
    }
    this.state.isProcessing = true;
    try {
      await lotteryService.drawWinner(
        BigInt(this.state.roundId!),
        account as AccountInterface
      );
      this.setAdminModalVisible(false);
      this.state.roundId = undefined;
      alert('Winner drawn successfully!');
    } catch (error) {
      console.error('Failed to draw winner:', error);
      alert('Failed to draw winner. Check console for details.');
    } finally {
      this.state.isProcessing = false;
    }
  };

  private async _tick() {}
}
