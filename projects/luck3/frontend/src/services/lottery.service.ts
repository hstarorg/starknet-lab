import { AppEnvs } from '@/constants';
import {
  Luck3ContractClient,
  type RoundInfo,
} from '@/lib/luck3/Luck3ContractClient';
import type { UserTicket } from '@/types/lottery.type';
import type { AccountInterface } from 'starknet';

// STRK token ABI (minimal for approval)

class LotteryService {
  private _contractClient: Luck3ContractClient;

  constructor() {
    this._contractClient = new Luck3ContractClient(
      AppEnvs.Luck3ContractAddress,
      AppEnvs.rpcUrl
    );
  }

  async getCurrentRoundInfo(): Promise<RoundInfo | null> {
    const { currentRoundId } = await this.getInfo();
    if (currentRoundId <= 0) {
      return null;
    }
    return await this.getRoundInfo(currentRoundId);
  }

  async getInfo() {
    return this._contractClient.getInfo();
  }

  /**
   * Get user's ticket for a specific round
   */
  async getUserTicket(
    userAddress: string,
    roundId: bigint
  ): Promise<UserTicket | null> {
    try {
      const userTicket = await this._contractClient.getUserTicket(
        userAddress,
        roundId
      );

      // Check if user has no ticket (guess = 0 means no ticket)
      if (userTicket.guess === 0) {
        return null;
      }

      return {
        roundId,
        guess: userTicket.guess,
        isWinner: userTicket.isWinner,
        reward: userTicket.reward,
        claimed: userTicket.claimed,
      };
    } catch (error) {
      console.error('Error getting user ticket:', error);
      return null;
    }
  }

  /**
   * Get round info for a specific round (returns null if invalid)
   */
  async getRoundInfo(roundId: number) {
    const roundInfo = await this._contractClient.getRoundInfo(roundId);

    // Check if round is valid (id should match requested id)
    if (roundInfo.id !== BigInt(roundId)) {
      return null;
    }

    return roundInfo;
  }

  /**
   * Get winning number for a round (from round info)
   */
  async getRoundWinningNumber(roundId: number): Promise<number | null> {
    try {
      const roundInfo = await this.getRoundInfo(roundId);
      if (!roundInfo) return null;

      return roundInfo.isDrawn ? roundInfo.winningNumber : null;
    } catch {
      // Round not found or not drawn yet
      return null;
    }
  }

  /**
   * Get winning numbers for multiple rounds in batch
   */
  async getRoundsWinningNumbers(
    roundIds: number[]
  ): Promise<(number | null)[]> {
    const promises = roundIds.map((roundId) =>
      this.getRoundWinningNumber(roundId)
    );
    return Promise.all(promises);
  }

  /**
   * Get user tickets for multiple rounds in batch
   */
  async getUserTicketsBatch(
    userAddress: string,
    roundIds: bigint[]
  ): Promise<(UserTicket | null)[]> {
    const promises = roundIds.map((roundId) =>
      this.getUserTicket(userAddress, roundId)
    );
    return Promise.all(promises);
  }

  /**
   * Get rounds information in batch using contract method
   */
  async getRoundsInfoBatch(roundIds: number[]): Promise<
    {
      roundId: bigint;
      endTime: bigint;
      prizePool: bigint;
      totalTickets: bigint;
      winningNumber: number | null;
      isDrawn: boolean;
    }[]
  > {
    const roundsInfo = await this._contractClient.getRoundsInfo(roundIds);

    return roundsInfo.map((roundInfo: any) => {
      // Handle different data formats from contract
      let roundId, endTime, prizePool, totalTickets, winningNumber, isDrawn;

      if (Array.isArray(roundInfo)) {
        [roundId, endTime, prizePool, totalTickets, winningNumber, isDrawn] =
          roundInfo;
      } else {
        // Handle object format
        const values = Object.values(roundInfo);
        [roundId, endTime, prizePool, totalTickets, winningNumber, isDrawn] =
          values;
      }

      return {
        roundId: BigInt(roundId), // Convert to bigint
        endTime: BigInt(endTime),
        prizePool: BigInt(prizePool),
        totalTickets: BigInt(totalTickets),
        winningNumber: isDrawn ? Number(winningNumber) : null,
        isDrawn: Boolean(isDrawn),
      };
    });
  }

  /**
   * Buy a lottery ticket with automatic approval handling
   */
  async buyTicket(
    roundId: number,
    guess: number,
    account: AccountInterface
  ): Promise<string> {
    const res = await this._contractClient.buyTicket(
      account,
      BigInt(roundId),
      guess
    );

    console.log(res);
    return '';
  }

  /**
   * Claim reward for a round
   */
  async claimReward(
    roundId: bigint,
    account: AccountInterface
  ): Promise<string> {
    return await this._contractClient.claimReward(account, roundId);
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
