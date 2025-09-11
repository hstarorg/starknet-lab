import type { AccountInterface } from 'starknet';
import { ContractClientBase } from '../ContractClientBase';
import { ABI } from './abi';
import { ERC20ContractClient } from '../erc20/ERC20ContractClient';
import type { Call } from 'starknet';
import { CallData, cairo, getChecksumAddress } from 'starknet';

export interface RoundInfo {
  id: bigint;
  endTime: bigint;
  prizePool: bigint;
  totalTickets: bigint;
  winningNumber: bigint;
  isDrawn: boolean;
}

export interface UserTicket {
  guess: number;
  isWinner: boolean;
  reward: bigint;
  claimed: boolean;
}

// Contract constants
export const TICKET_COST = 1000000000000000000n; // 1 STRK in wei
export const MIN_GUESS = 10;
export const MAX_GUESS = 99;
const STRK_TOKEN_ADDRESS =
  '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
export class Luck3ContractClient extends ContractClientBase<typeof ABI> {
  private rpcUrl?: string;

  private readonly strkClient: ERC20ContractClient;

  constructor(contractAddress: string, rpcUrl?: string) {
    super({
      contractAddress,
      abi: ABI,
      rpcUrl,
    });
    this.rpcUrl = rpcUrl;
    this.strkClient = new ERC20ContractClient(STRK_TOKEN_ADDRESS, this.rpcUrl);
  }

  // View functions
  async getInfo() {
    const result = await this.contract.get_info();
    return {
      owner: getChecksumAddress(result[0] as any),
      currentRoundId: result[1],
      accumulatedPrizePool: result[2] as bigint,
    };
  }

  async getRoundInfo(roundId: number): Promise<RoundInfo> {
    const result = await this.contract.get_round_info(roundId);
    const [id, endTime, prizePool, totalTickets, winningNumber, isDrawn] =
      Object.values(result) as [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        boolean
      ];
    return {
      id,
      endTime,
      prizePool,
      totalTickets,
      winningNumber,
      isDrawn,
    };
  }

  async getUserTicket(
    userAddress: string,
    roundId: bigint
  ): Promise<UserTicket> {
    const result = await this.contract.get_user_ticket(userAddress, roundId);
    const [guess, isWinner, reward, claimed] = Object.values(result) as [
      number,
      boolean,
      bigint,
      boolean
    ];
    return {
      guess,
      isWinner,
      reward,
      claimed,
    };
  }

  async getRoundsInfo(roundIds: number[]): Promise<RoundInfo[]> {
    const promises = roundIds.map((id) => this.getRoundInfo(id));
    return await Promise.all(promises);
  }

  // External functions (require account)
  async buyTicket(
    account: AccountInterface,
    roundId: bigint,
    guess: number
  ): Promise<string> {
    // Validate guess range
    if (guess < MIN_GUESS || guess > MAX_GUESS) {
      throw new Error(`Guess must be between ${MIN_GUESS} and ${MAX_GUESS}`);
    }

    const userAddress = account.address;

    // Check current allowance
    const allowance = await this.strkClient.allowance(
      userAddress,
      this.contract.address
    );

    const calls: Call[] = [];
    // If allowance is insufficient, add approval call
    if (allowance < TICKET_COST) {
      calls.push({
        contractAddress: STRK_TOKEN_ADDRESS,
        entrypoint: 'approve',
        calldata: CallData.compile({
          spender: this.contract.address,
          amount: cairo.uint256(TICKET_COST),
        }),
      });
    }

    // Add buy ticket call
    calls.push({
      contractAddress: this.contract.address,
      entrypoint: 'buy_ticket',
      calldata: CallData.compile({
        round_id: roundId,
        guess,
      }),
    });

    // Execute multicall
    const tx = await this.multicall(calls, account);
    return (tx as any).transaction_hash;
  }

  async claimReward(
    account: AccountInterface,
    roundId: bigint
  ): Promise<string> {
    this.contract.connect(account);
    const tx = await this.contract.claim_reward(roundId);
    return (tx as any).transaction_hash;
  }

  async createRound(
    account: AccountInterface,
    durationSeconds: bigint
  ): Promise<string> {
    this.contract.connect(account);
    const tx = await this.contract.create_round(durationSeconds);
    return (tx as any).transaction_hash;
  }

  async drawWinner(
    account: AccountInterface,
    roundId: bigint
  ): Promise<string> {
    this.contract.connect(account);
    const tx = await this.contract.draw_winner(roundId);
    return (tx as any).transaction_hash;
  }
}
