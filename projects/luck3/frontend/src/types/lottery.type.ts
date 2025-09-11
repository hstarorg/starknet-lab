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
