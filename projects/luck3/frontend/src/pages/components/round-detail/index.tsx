import { Card, Group, Text, Stack, Badge, Box, Button } from '@mantine/core';
import {
  TrophyIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/utils';
import { RoundDetailStore } from './RoundDetailStore';
import { useStore } from '@/hooks';
import { useEffect } from 'react';
import { useAccount } from '@starknet-react/core';

interface RoundDetailProps {
  roundId: number;
  showActions?: boolean;
  compact?: boolean;
}

export function RoundDetail({
  roundId,
  showActions = false,
  compact = false,
}: RoundDetailProps) {
  const { store, snapshot } = useStore(RoundDetailStore);
  const { address } = useAccount();

  useEffect(() => {
    if (roundId) {
      store.loadRoundInfo(roundId, address);
    }
  }, [store, roundId, address]);

  const round = snapshot.round;

  if (!round) {
    return null;
  }

  const roundStatus = round.roundStatus;

  console.log('Round Detail:', round);

  return (
    <Card
      withBorder
      radius="lg"
      className="bg-orange-50 hover:bg-orange-100 transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-orange-200"
      h="100%"
    >
      <Stack gap="sm" h="100%">
        {/* Round Header */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <TrophyIcon className="h-4 w-4 text-gray-600" />
            <Text size="sm" fw={600}>
              Round #{round.id}
            </Text>
          </Group>
          <Badge size="xs" color={roundStatus?.color} variant="filled">
            {roundStatus?.text}
          </Badge>
        </Group>

        {/* Round Date */}
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <ClockIcon className="h-3 w-3 text-gray-500" />
            <Text size="xs" c="dimmed">
              {round.endTime > 0n
                ? formatDate(new Date(round.endTime * 1000), 'date')
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
            {Number(round.prizePool) > 0 ? (
              <>
                <Text size="sm" fw={600} c="green">
                  {round.prizePool}
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
            className="bg-orange-100 p-2 rounded border border-orange-200"
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
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                  // onClick={() => onClaimReward?.(Number(round.roundId))}
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
