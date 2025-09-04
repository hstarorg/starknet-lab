import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@starknet-react/core';
import { lotteryService } from '../lib/daily-lottery/lottery-service';
import type {
  CurrentRoundInfo,
  UserTicket,
  LotteryError,
  LotteryTransaction,
} from '../lib/daily-lottery/types';

export function useLottery() {
  const { address, isConnected } = useAccount();

  const [currentRound, setCurrentRound] = useState<CurrentRoundInfo | null>(
    null
  );
  const [userTickets, setUserTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LotteryError | null>(null);
  const [transactions, setTransactions] = useState<LotteryTransaction[]>([]);

  // Read current round info
  const fetchCurrentRound = useCallback(async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      setError(null);

      const roundInfo = await lotteryService.getCurrentRoundInfo();
      setCurrentRound(roundInfo);
    } catch (err) {
      setError(err as LotteryError);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // Read user tickets
  const fetchUserTickets = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      setLoading(true);
      setError(null);

      const tickets = await lotteryService.getUserTickets(address);
      setUserTickets(tickets);
    } catch (err) {
      setError(err as LotteryError);
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  // Buy ticket transaction
  const buyTicket = useCallback(
    async (guess: number): Promise<string | null> => {
      if (!address) {
        setError({
          type: 'wallet',
          message: 'Please connect your wallet first',
        });
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Add transaction to pending state
        const pendingTx: LotteryTransaction = {
          hash: 'pending',
          status: 'pending',
          type: 'buy_ticket',
          guess,
          amount: BigInt('1000000000000000000'), // 1 STRK
        };
        setTransactions((prev) => [...prev, pendingTx]);

        const txHash = await lotteryService.buyTicket(guess, { address });

        // Update transaction with actual hash
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.hash === 'pending'
              ? { ...tx, hash: txHash, status: 'pending' as const }
              : tx
          )
        );

        // Refresh data after transaction
        await Promise.all([fetchCurrentRound(), fetchUserTickets()]);

        return txHash;
      } catch (err) {
        setError(err as LotteryError);

        // Remove pending transaction
        setTransactions((prev) => prev.filter((tx) => tx.hash !== 'pending'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [address, fetchCurrentRound, fetchUserTickets]
  );

  // Claim reward transaction
  const claimReward = useCallback(
    async (roundId: bigint): Promise<string | null> => {
      if (!address) {
        setError({
          type: 'wallet',
          message: 'Please connect your wallet first',
        });
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const pendingTx: LotteryTransaction = {
          hash: 'pending',
          status: 'pending',
          type: 'claim_reward',
          roundId,
        };
        setTransactions((prev) => [...prev, pendingTx]);

        const txHash = await lotteryService.claimReward(roundId, { address });

        setTransactions((prev) =>
          prev.map((tx) =>
            tx.hash === 'pending'
              ? { ...tx, hash: txHash, status: 'pending' as const }
              : tx
          )
        );

        await fetchUserTickets();
        return txHash;
      } catch (err) {
        setError(err as LotteryError);
        setTransactions((prev) => prev.filter((tx) => tx.hash !== 'pending'));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [address, fetchUserTickets]
  );

  // Trigger draw if expired
  const triggerDraw = useCallback(async (): Promise<string | null> => {
    if (!address) {
      setError({
        type: 'wallet',
        message: 'Please connect your wallet first',
      });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const txHash = await lotteryService.triggerDrawIfExpired({ address });

      if (txHash) {
        const pendingTx: LotteryTransaction = {
          hash: txHash,
          status: 'pending',
          type: 'trigger_draw',
        };
        setTransactions((prev) => [...prev, pendingTx]);
      }

      return txHash;
    } catch (err) {
      setError(err as LotteryError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Get pending rewards
  const getPendingRewards = useCallback((): bigint => {
    return userTickets
      .filter((ticket) => ticket.isWinner && !ticket.claimed)
      .reduce((total, ticket) => total + ticket.reward, 0n);
  }, [userTickets]);

  // Get total winnings
  const getTotalWinnings = useCallback((): bigint => {
    return userTickets
      .filter((ticket) => ticket.isWinner)
      .reduce((total, ticket) => total + ticket.reward, 0n);
  }, [userTickets]);

  // Initialize data
  useEffect(() => {
    if (isConnected) {
      fetchCurrentRound();
      fetchUserTickets();
    }
  }, [isConnected, fetchCurrentRound, fetchUserTickets]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      fetchCurrentRound();
      fetchUserTickets();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, fetchCurrentRound, fetchUserTickets]);

  // Update transaction status
  const updateTransactionStatus = useCallback(
    (hash: string, status: LotteryTransaction['status']) => {
      setTransactions((prev) =>
        prev.map((tx) => (tx.hash === hash ? { ...tx, status } : tx))
      );
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    currentRound,
    userTickets,
    loading,
    error,
    transactions,
    isConnected,
    address,

    // Computed values
    pendingRewards: getPendingRewards(),
    totalWinnings: getTotalWinnings(),

    // Actions
    buyTicket,
    claimReward,
    triggerDraw,
    refresh: () => {
      fetchCurrentRound();
      fetchUserTickets();
    },
    clearError,
    updateTransactionStatus,
  };
}
