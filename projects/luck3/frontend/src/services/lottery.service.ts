import { AppEnvs, AppConf } from '@/constants';
import { ERC20ContractClient } from '@/lib/erc20/ERC20ContractClient';
import { Luck3ContractClient } from '@/lib/luck3/Luck3ContractClient';
import type { CurrentRoundInfo, UserTicket } from '@/types/lottery.type';
import { notifications } from '@mantine/notifications';
import { cairo, CallData, type Call } from 'starknet';

const LOTTERY_CONFIG = AppConf.LOTTERY_CONFIG;

// STRK token ABI (minimal for approval)

class LotteryService {
  private _contractClient: Luck3ContractClient;

  private _strkContract: ERC20ContractClient;

  constructor() {
    this._contractClient = new Luck3ContractClient(
      AppEnvs.Luck3ContractAddress,
      AppEnvs.rpcUrl
    );
    this._strkContract = new ERC20ContractClient(
      AppEnvs.StrkTokenAddress,
      AppEnvs.rpcUrl
    );
  }

  async getCurrentRoundInfo(): Promise<CurrentRoundInfo> {
    try {
      const res = await this._contractClient.getCurrentRoundInfo();
      const [roundId, endTime, prizePool, totalTickets] = Object.values(
        res
      ) as any;

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
   * Get global statistics
   */
  async getStatistics(): Promise<{
    totalRounds: bigint;
    totalParticipants: bigint;
    totalPrizePool: bigint;
  }> {
    try {
      const res = await this._contractClient.call('get_statistics');
      const [totalRounds, totalParticipants, totalPrizePool] = Object.values(
        res
      ) as any;

      return {
        totalRounds,
        totalParticipants,
        totalPrizePool,
      };
    } catch (error) {
      throw this.handleContractError('Failed to get statistics', error);
    }
  }

  /**
   * Check if user has sufficient STRK balance
   */
  private async _checkStrkBalance(userAddress: string): Promise<bigint> {
    return this._strkContract.balanceOf(userAddress);
  }

  private async _getStrkAllowance(userAddress: string, spenderAddress: string) {
    const allowance = await this._strkContract.allowance(
      userAddress,
      spenderAddress
    );
    return allowance;
  }

  /**
   * Get user's ticket for a specific round
   */
  async getUserTicket(
    userAddress: string,
    roundId: bigint
  ): Promise<UserTicket | null> {
    const res = await this._contractClient.call('get_user_tickets', [
      userAddress,
      roundId,
    ]);
    console.log('User ticket response:', res);

    // Handle different possible response formats
    let guess: number;
    let isWinner: boolean;

    if (Array.isArray(res)) {
      [guess, isWinner] = res as [number, boolean];
    } else {
      const values = Object.values(res);
      [guess, isWinner] = values as [number, boolean];
    }

    // Ensure guess is a number and check if user has no ticket
    const guessNum = Number(guess);
    if (isNaN(guessNum) || guessNum === 0 || guessNum < 0) {
      return null; // No ticket purchased
    }

    const reward = (await this._contractClient.call('get_user_reward', [
      userAddress,
      roundId,
    ])) as bigint;

    return {
      roundId,
      guess: guessNum,
      isWinner,
      reward,
      claimed: false, // TODO: Check claimed status
    };
  }

  /**
   * Get winning number for a round
   */
  async getRoundWinningNumber(roundId: bigint): Promise<number | null> {
    try {
      const winningNumber = await this._contractClient.call(
        'get_round_winning_number',
        roundId
      );
      return Number(winningNumber);
    } catch {
      // Round not drawn yet
      return null;
    }
  }

  /**
   * Get winning numbers for multiple rounds in batch
   */
  async getRoundsWinningNumbers(
    roundIds: bigint[]
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
  async getRoundsInfoBatch(roundIds: bigint[]): Promise<
    {
      roundId: bigint;
      endTime: bigint;
      prizePool: bigint;
      totalTickets: bigint;
      winningNumber: number | null;
      isDrawn: boolean;
    }[]
  > {
    try {
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
    } catch (error) {
      throw this.handleContractError(
        'Failed to get rounds info in batch',
        error
      );
    }
  }

  /**
   * Buy a lottery ticket with automatic approval handling
   */
  async buyTicket(
    guess: number,
    account: any // StarknetAccount from starknet-react
  ): Promise<string> {
    this._validateGuess(guess);

    const userAddress = account.address;
    const needAmount = LOTTERY_CONFIG.ticketCost;

    // Check STRK balance
    const balance = await this._checkStrkBalance(userAddress);
    if (balance < needAmount) {
      notifications.show({
        message: 'Insufficient STRK balance to purchase ticket',
      });
    }

    // Check current allowance
    const allowance = await this._getStrkAllowance(
      userAddress,
      AppEnvs.Luck3ContractAddress
    );

    const calls: Call[] = [];
    if (allowance < needAmount) {
      calls.push({
        contractAddress: AppEnvs.StrkTokenAddress,
        entrypoint: 'approve',
        calldata: CallData.compile({
          spender: AppEnvs.Luck3ContractAddress,
          amount: cairo.uint256(needAmount),
        }),
      });
    }
    calls.push({
      contractAddress: AppEnvs.Luck3ContractAddress,
      entrypoint: 'buy_ticket',
      calldata: CallData.compile({ guess }),
    });

    // Now buy the ticket
    const tx = await this._contractClient.multicall(calls, account);
    console.log(tx);
    return '';
  }

  /**
   * Claim reward for a round
   */
  async claimReward(
    roundId: bigint,
    account: any // StarknetAccount from starknet-react
  ): Promise<string> {
    try {
      const tx = await this._contractClient.invoke(account, 'claim_reward', [
        roundId,
      ]);
      return tx.transaction_hash;
    } catch (error) {
      throw this.handleContractError('Failed to claim reward', error);
    }
  }

  /**
   * Draw rounds up to specified round ID
   */
  async drawRoundsUpTo(roundId: bigint, account: any): Promise<string> {
    try {
      const tx = await this._contractClient.invoke(
        account,
        'draw_rounds_up_to',
        [roundId]
      );
      await this._contractClient.waitForTransaction(tx.transaction_hash);
      return tx.transaction_hash;
    } catch (error) {
      throw this.handleContractError(
        'Failed to draw rounds up to specified round',
        error
      );
    }
  }

  /**
   * Validate guess range
   */
  private _validateGuess(guess: number): void {
    if (guess < LOTTERY_CONFIG.minGuess || guess > LOTTERY_CONFIG.maxGuess) {
      throw new Error(
        `Guess must be between ${LOTTERY_CONFIG.minGuess} and ${LOTTERY_CONFIG.maxGuess}`
      );
    }
  }

  /**
   * Handle and categorize contract errors
   */
  private handleContractError(message: string, error: any) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    if (errorMessage.includes('Invalid guess range')) {
      return {
        type: 'validation',
        message: 'Please enter a number between 10 and 99',
      };
    }

    if (errorMessage.includes('Already bought ticket')) {
      return {
        type: 'validation',
        message: 'You have already bought a ticket for this round',
      };
    }

    if (
      errorMessage.includes('Insufficient balance') ||
      errorMessage.includes('u256_sub Overflow')
    ) {
      return {
        type: 'insufficient_funds',
        message: 'Insufficient STRK balance or allowance to purchase ticket',
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

export const lotteryService = new LotteryService();
