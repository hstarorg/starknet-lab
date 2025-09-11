export interface LotteryRound {
  id: number;
  // startTime: number;
  endTime: number;
  prizePool: string;
  winningNumber: number;
  totalTickets: number;
  isDrawn: boolean;
}

export interface UserTicket {
  roundId: number;
  guess: number;
  isWinner: boolean;
  reward: string;
  claimed: boolean;
}
