import type { AccountInterface } from 'starknet';
import { AppEnvs } from '@/constants';
import { Luck3ContractClient } from '@/lib/luck3/Luck3ContractClient';
import type { LotteryRound, UserTicket } from '@/types/lottery.type';
import { formatSTRK } from '@/utils';

// STRK token ABI (minimal for approval)

class LotteryService {
  private _contractClient: Luck3ContractClient;

  constructor() {
    this._contractClient = new Luck3ContractClient(
      AppEnvs.Luck3ContractAddress,
      AppEnvs.rpcUrl
    );
  }

  async getCurrentRoundInfo(): Promise<LotteryRound | null> {
    const { currentRoundId } = await this.getInfo();
    if (currentRoundId <= 0) {
      return null;
    }
    return await this.getRoundInfo(currentRoundId);
  }

  async getInfo() {
    const info = await this._contractClient.getInfo();
    return {
      owner: info.owner,
      currentRoundId: Number(info.currentRoundId),
      accumulatedPrizePool: formatSTRK(info.accumulatedPrizePool),
    };
  }

  /**
   * Get user's ticket for a specific round
   */
  async getUserTicket(
    userAddress: string,
    roundId: number
  ): Promise<UserTicket | null> {
    const userTicket = await this._contractClient.getUserTicket(
      userAddress,
      BigInt(roundId)
    );
    // Check if user has no ticket (guess = 0 means no ticket)
    if (!userTicket.guess) {
      return null;
    }

    return {
      roundId,
      guess: Number(userTicket.guess),
      isWinner: userTicket.isWinner,
      reward: formatSTRK(userTicket.reward),
      claimed: userTicket.claimed,
    };
  }

  /**
   * Get round info for a specific round (returns null if invalid)
   */
  async getRoundInfo(roundId: number) {
    const round = await this._contractClient.getRoundInfo(roundId);

    // Check if round is valid (id should match requested id)
    if (round.id !== BigInt(roundId)) {
      return null;
    }

    return {
      id: Number(round.id),
      endTime: Number(round.endTime),
      prizePool: formatSTRK(round.prizePool),
      winningNumber: Number(round.winningNumber),
      totalTickets: Number(round.totalTickets),
      isDrawn: round.isDrawn,
    } as LotteryRound;
  }

  /**
   * Buy a lottery ticket with automatic approval handling
   */
  async buyTicket(
    roundId: number,
    guess: number,
    account: AccountInterface
  ): Promise<string> {
    const txHash = await this._contractClient.buyTicket(
      account,
      BigInt(roundId),
      guess
    );

    console.log(txHash, 'buyTicket txHash');
    return txHash;
  }

  /**
   * Claim reward for a round
   */
  async claimReward(
    roundId: number,
    account: AccountInterface
  ): Promise<string> {
    return await this._contractClient.claimReward(account, BigInt(roundId));
  }

  /**
   * Create a new lottery round (admin only)
   */
  async createRound(
    durationSeconds: bigint,
    account: AccountInterface
  ): Promise<string> {
    return await this._contractClient.createRound(account, durationSeconds);
  }

  /**
   * Draw winner for a round
   */
  async drawWinner(
    roundId: bigint,
    account: AccountInterface
  ): Promise<string> {
    return await this._contractClient.drawWinner(account, roundId);
  }
}

export const lotteryService = new LotteryService();
