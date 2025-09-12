import {
  Card,
  Group,
  Text,
  Stack,
  Badge,
  Box,
  Button,
} from '@mantine/core';
import {
  TrophyIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { formatSTRK } from '@/utils';
import type { UserTicket } from '@/types/lottery.type';

export interface RoundDetailData {
  roundId: bigint;
  endTime: bigint;
  prizePool: bigint;
  totalTickets?: bigint;
  winningNumber?: number;
  userTicket?: UserTicket | null;
}

interface RoundDetailProps {
  round: RoundDetailData;
  showActions?: boolean;
  onClaimReward?: (roundId: number) => void;
  compact?: boolean;
}

export function RoundDetail({
  round,
  showActions = false,
  onClaimReward,
  compact = false,
}: RoundDetailProps) {
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoundStatus = (round: RoundDetailData) => {
    if (round.winningNumber) {
      return { status: 'completed', color: 'green', text: 'Completed' };
    }
    const now = Date.now() / 1000;
    const endTime = Number(round.endTime);
    if (now > endTime) {
      // Check if round has participants
      const hasParticipants = round.totalTickets
        ? round.totalTickets > 0n
        : round.prizePool > 0n;
      if (hasParticipants) {
        return { status: 'drawing', color: 'orange', text: 'Drawing' };
      } else {
        return { status: 'expired', color: 'gray', text: 'Expired' };
      }
    }
    return { status: 'active', color: 'blue', text: 'Active' };
  };

  const roundStatus = getRoundStatus(round);

  return (
    <Card
      withBorder
      radius="sm"
      className="bg-gradient-to-r from-gray-50 to-white"
    >
      <Stack gap="sm">
        {/* Round Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <TrophyIcon className="h-4 w-4 text-gray-600" />
            <Text size="sm" fw={600}>
              Round #{round.roundId.toString()}
            </Text>
          </Group>
          <Badge
            size="xs"
            color={roundStatus.color}
            variant="filled"
          >
            {roundStatus.text}
          </Badge>
        </Group>

        {/* Round Date */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ClockIcon className="h-3 w-3 text-gray-500" />
            <Text size="xs" c="dimmed">
              {round.endTime > 0n
                ? formatDate(round.endTime)
                : 'Date not available'}
            </Text>
          </Group>
        </Group>

        {/* Winning Number */}
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Winning Number:
          </Text>
          <Box>
            {round.winningNumber && round.winningNumber > 0 ? (
              <Badge
                size="lg"
                color="green"
                variant="filled"
                className="font-bold text-lg px-3 py-1"
              >
                {round.winningNumber}
              </Badge>
            ) : (
              <Badge size="sm" color="gray" variant="light">
                Pending
              </Badge>
            )}
          </Box>
        </Group>

        {/* Prize Pool */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <CurrencyDollarIcon className="h-3 w-3 text-gray-500" />
            <Text size="xs" c="dimmed">
              Prize Pool:
            </Text>
          </Group>
          <Stack gap="xs" align="end">
            {round.prizePool > 0n ? (
              <>
                <Text size="sm" fw={600} c="green">
                  {formatSTRK(round.prizePool)}
                </Text>
                {round.userTicket && (
                  <Text size="xs" c="dimmed">
                    Your contribution
                  </Text>
                )}
              </>
            ) : (
              <Text size="xs" c="dimmed">
                Data not available
              </Text>
            )}
          </Stack>
        </Group>

        {/* Total Tickets (only show if available) */}
        {round.totalTickets !== undefined && !compact && (
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <TicketIcon className="h-3 w-3 text-gray-500" />
              <Text size="xs" c="dimmed">
                Total Tickets:
              </Text>
            </Group>
            <Text size="sm" fw={500}>
              {round.totalTickets.toString()}
            </Text>
          </Group>
        )}

        {/* User's Bet */}
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Your Bet:
          </Text>
          {round.userTicket ? (
            <Group gap="xs">
              <Badge
                size="sm"
                color={round.userTicket.isWinner ? 'green' : 'blue'}
                variant="light"
              >
                {round.userTicket.guess}
              </Badge>
              {round.userTicket.isWinner && (
                <Badge
                  size="xs"
                  color="green"
                  variant="filled"
                  leftSection={<TrophyIcon className="h-3 w-3" />}
                >
                  Winner!
                </Badge>
              )}
            </Group>
          ) : (
            <Text size="xs" c="dimmed">
              -
            </Text>
          )}
        </Group>

        {/* Reward Info */}
        {round.userTicket?.isWinner && !round.userTicket.claimed && (
          <Group
            justify="space-between"
            align="center"
            className="bg-green-50 p-2 rounded"
          >
            <Text size="xs" c="green" fw={500}>
              Your Reward:
            </Text>
            <Badge
              size="sm"
              color="green"
              variant="filled"
              leftSection={<CurrencyDollarIcon className="h-3 w-3" />}
            >
              {round.userTicket.reward}
            </Badge>
          </Group>
        )}

        {/* Action Buttons */}
        {showActions && (
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              Actions:
            </Text>
            <Group gap="xs">
              {round.userTicket?.isWinner && !round.userTicket.claimed && (
                <Button
                  size="xs"
                  variant="filled"
                  color="green"
                  onClick={() => onClaimReward?.(Number(round.roundId))}
                >
                  Claim Reward
                </Button>
              )}
            </Group>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
