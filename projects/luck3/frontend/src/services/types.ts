import { ContractAddress } from 'starknet';

export interface LotteryRound {
  id: bigint;
  startTime: bigint;
  endTime: bigint;
  prizePool: bigint;
  winningNumber: number;
  isDrawn: boolean;
}

export interface UserTicket {
  roundId: bigint;
  guess: number;
  isWinner: boolean;
  reward: bigint;
  claimed: boolean;
}

export interface CurrentRoundInfo {
  roundId: bigint;
  endTime: bigint;
  prizePool: bigint;
  totalTickets: bigint;
  timeRemaining: bigint;
}

export interface LotteryTransaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  type: 'buy_ticket' | 'claim_reward' | 'trigger_draw';
  roundId?: bigint;
  guess?: number;
  amount?: bigint;
  error?: string;
}

export interface LotteryState {
  currentRound: CurrentRoundInfo | null;
  userTickets: UserTicket[];
  totalRewards: bigint;
  pendingRewards: bigint;
  transactions: LotteryTransaction[];
  isLoading: boolean;
  error: string | null;
}

export interface LotteryError {
  type: 'validation' | 'contract' | 'network' | 'wallet' | 'insufficient_funds';
  message: string;
  action?: 'retry' | 'fix' | 'info';
}

export interface BuyTicketParams {
  guess: number;
  amount?: bigint;
}

export interface ClaimRewardParams {
  roundId: bigint;
}