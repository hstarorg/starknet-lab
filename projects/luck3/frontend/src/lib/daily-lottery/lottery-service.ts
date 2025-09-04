import { Contract, RpcProvider } from 'starknet';
import {
  CONTRACT_ADDRESSES,
  NETWORK_CONFIG,
  LOTTERY_CONFIG,
} from './constants';
import lotteryAbi from './abi/lottery-abi.json';
import type { CurrentRoundInfo, UserTicket, LotteryError } from './types';

export class LotteryService {
  private contract: Contract;
  private provider: RpcProvider;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: NETWORK_CONFIG.rpcUrl,
    });

    this.contract = new Contract(
      lotteryAbi,
      CONTRACT_ADDRESSES.lottery,
      this.provider
    );
  }

  /**
   * Get current round information
   */
  async getCurrentRoundInfo(): Promise<CurrentRoundInfo> {
    try {
      const [roundId, endTime, prizePool, totalTickets] =
        await this.contract.call('get_current_round_info');

      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const timeRemaining = endTime > currentTime ? endTime - currentTime : 0n;

      return {
        roundId,
        endTime,
        prizePool,
        totalTickets,
        timeRemaining,
      };
    } catch (error) {
      throw this.handleContractError('Failed to get current round info', error);
    }
  }

  /**
   * Get user's ticket for a specific round
   */
  async getUserTicket(
    userAddress: string,
    roundId: bigint
  ): Promise<UserTicket | null> {
    try {
      const [guess, isWinner] = await this.contract.call('get_user_tickets', [
        userAddress,
        roundId,
      ]);

      if (guess === 0) return null; // No ticket

      const reward = await this.contract.call('get_user_reward', [
        userAddress,
        roundId,
      ]);

      return {
        roundId,
        guess: Number(guess),
        isWinner,
        reward,
        claimed: false, // TODO: Check claimed status
      };
    } catch (error) {
      throw this.handleContractError('Failed to get user ticket', error);
    }
  }

  /**
   * Get winning number for a round
   */
  async getRoundWinningNumber(roundId: bigint): Promise<number | null> {
    try {
      const winningNumber = await this.contract.call(
        'get_round_winning_number',
        [roundId]
      );
      return Number(winningNumber);
    } catch {
      // Round not drawn yet
      return null;
    }
  }

  /**
   * Buy a lottery ticket
   */
  async buyTicket(
    guess: number,
    account: any // StarknetAccount from starknet-react
  ): Promise<string> {
    this.validateGuess(guess);

    try {
      const contractWithAccount = this.contract.connect(account);
      const tx = await contractWithAccount.invoke('buy_ticket', [guess]);
      return tx.transaction_hash;
    } catch (error) {
      throw this.handleContractError('Failed to buy ticket', error);
    }
  }

  /**
   * Claim reward for a round
   */
  async claimReward(
    roundId: bigint,
    account: any // StarknetAccount from starknet-react
  ): Promise<string> {
    try {
      const contractWithAccount = this.contract.connect(account);
      const tx = await contractWithAccount.invoke('claim_reward', [roundId]);
      return tx.transaction_hash;
    } catch (error) {
      throw this.handleContractError('Failed to claim reward', error);
    }
  }

  /**
   * Trigger draw if round has expired
   */
  async triggerDrawIfExpired(account: any): Promise<string | null> {
    try {
      const contractWithAccount = this.contract.connect(account);
      const tx = await contractWithAccount.invoke('trigger_draw_if_expired');
      return tx.transaction_hash;
    } catch (error) {
      // Round not expired or already drawn
      return null;
    }
  }

  /**
   * Get user's tickets across all rounds
   */
  async getUserTickets(userAddress: string): Promise<UserTicket[]> {
    try {
      const currentRound = await this.getCurrentRoundInfo();
      const tickets: UserTicket[] = [];

      // Check last 10 rounds for simplicity
      for (let i = 0; i < 10; i++) {
        const roundId = currentRound.roundId - BigInt(i);
        if (roundId <= 0) break;

        const ticket = await this.getUserTicket(userAddress, roundId);
        if (ticket) {
          tickets.push(ticket);
        }
      }

      return tickets;
    } catch (error) {
      throw this.handleContractError('Failed to get user tickets', error);
    }
  }

  /**
   * Validate guess range
   */
  private validateGuess(guess: number): void {
    if (guess < LOTTERY_CONFIG.minGuess || guess > LOTTERY_CONFIG.maxGuess) {
      throw new Error(
        `Guess must be between ${LOTTERY_CONFIG.minGuess} and ${LOTTERY_CONFIG.maxGuess}`
      );
    }
  }

  /**
   * Handle and categorize contract errors
   */
  private handleContractError(message: string, error: any): LotteryError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    if (errorMessage.includes('Invalid guess range')) {
      return {
        type: 'validation',
        message: 'Please enter a number between 0 and 99',
      };
    }

    if (errorMessage.includes('Already bought ticket')) {
      return {
        type: 'validation',
        message: 'You have already bought a ticket for this round',
      };
    }

    if (errorMessage.includes('Insufficient balance')) {
      return {
        type: 'insufficient_funds',
        message: 'Insufficient STRK balance to purchase ticket',
      };
    }

    if (errorMessage.includes('user rejected')) {
      return {
        type: 'wallet',
        message: 'Transaction was rejected by wallet',
      };
    }

    return {
      type: 'contract',
      message: `${message}: ${errorMessage}`,
    };
  }
}

// Singleton instance
export const lotteryService = new LotteryService();
