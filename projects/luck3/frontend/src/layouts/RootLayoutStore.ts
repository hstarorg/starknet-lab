import { lotteryService } from '@/services/lottery.service';
import { notifications } from '@mantine/notifications';
import type { AccountInterface } from 'starknet';
import { proxy } from 'valtio';

type ViewModel = {
  adminModalOpen?: boolean;
  owner?: string;
  adminAction?: 'create' | 'draw' | 'withdraw' | null;
  isProcessing?: boolean;
  durationSeconds: number;
  roundId?: number;
  withdrawAmount: number;
};
export class RootLayoutStore {
  state = proxy<ViewModel>({ durationSeconds: 86400, withdrawAmount: 0 });
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

  setAdminAction = (action: 'create' | 'draw' | 'withdraw' | null) => {
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
      notifications.show({
        title: 'Success',
        message: 'Round created successfully!',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to create round:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create round. Check console for details.',
        color: 'red',
      });
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
      notifications.show({
        title: 'Success',
        message: 'Winner drawn successfully!',
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to draw winner:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to draw winner. Check console for details.',
        color: 'red',
      });
    } finally {
      this.state.isProcessing = false;
    }
  };

  setWithdrawAmount = (value: number) => {
    this.state.withdrawAmount = value;
  };

  handleWithdrawFunds = async (account: AccountInterface) => {
    if (!this.state.withdrawAmount || this.state.withdrawAmount <= 0) {
      return notifications.show({
        title: 'Error',
        message: 'Please enter a valid withdrawal amount.',
      });
    }
    this.state.isProcessing = true;
    try {
      const amountInWei =
        BigInt(String(this.state.withdrawAmount)) * BigInt(10 ** 18); // Convert to wei
      await lotteryService.withdrawAccumulatedPrizePool(
        amountInWei,
        account as AccountInterface
      );
      this.setAdminModalVisible(false);
      this.state.withdrawAmount = 0;
      notifications.show({ message: 'Funds withdrawn successfully!' });
    } catch (error) {
      console.error('Failed to withdraw funds:', error);
      notifications.show({
        message: 'Failed to withdraw funds. Check console for details.',
      });
    } finally {
      this.state.isProcessing = false;
    }
  };

  private async _tick() {}
}
