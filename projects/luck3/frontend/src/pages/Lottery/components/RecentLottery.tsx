import {
  Card,
  Group,
  Text,
  Stack,
  Badge,
  LoadingOverlay,
  Box,
} from '@mantine/core';
import {
  TrophyIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';
import { formatSTRK } from '@/utils';
import type { RecentRoundInfo } from '../LotteryStore';

type RecentLotteryProps = {
  recentRounds: readonly RecentRoundInfo[];
  recentRoundsLoading?: boolean;
};

export function RecentLottery(props: RecentLotteryProps) {
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoundStatus = (round: any) => {
    if (round.winningNumber) {
      return { status: 'completed', color: 'green', text: 'Completed' };
    }
    const now = Date.now() / 1000;
    const endTime = Number(round.endTime);
    if (now > endTime) {
      // Check if round has participants (prize pool > 0 indicates participants)
      const hasParticipants = round.prizePool > 0n;
      if (hasParticipants) {
        return { status: 'drawing', color: 'orange', text: 'Drawing' };
      } else {
        return { status: 'expired', color: 'gray', text: 'Expired' };
      }
    }
    return { status: 'active', color: 'blue', text: 'Active' };
  };

  return (
    <Card withBorder shadow="sm" radius="md">
      <Card.Section inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>Recent Rounds</Text>
          <Badge size="sm" variant="light" color="blue">
            Last 2
          </Badge>
        </Group>
      </Card.Section>
      <Card.Section p="md">
        <LoadingOverlay visible={props.recentRoundsLoading} />
        <Stack gap="md">
          {props.recentRounds.length === 0 && !props.recentRoundsLoading ? (
            <Box py="xl" ta="center">
              <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <Text c="dimmed" size="sm">
                No recent rounds available
              </Text>
            </Box>
          ) : (
            props.recentRounds.map((round) => {
              const roundStatus = getRoundStatus(round);
              return (
                <Card
                  key={round.roundId.toString()}
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
                      <Group gap="xs">
                        <Badge
                          size="xs"
                          color={roundStatus.color}
                          variant="filled"
                        >
                          {roundStatus.text}
                        </Badge>
                      </Group>
                    </Group>

                    {/* Round Date */}
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        <ClockIcon className="h-3 w-3 text-gray-500" />
                        <Text size="xs" c="dimmed">
                          {formatDate(round.endTime)}
                        </Text>
                      </Group>
                    </Group>

                    {/* Winning Number */}
                    <Group justify="space-between" align="center">
                      <Text size="xs" c="dimmed">
                        Winning Number:
                      </Text>
                      <Box>
                        {round.winningNumber ? (
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
                    {round.userTicket?.isWinner &&
                      round.userTicket.reward > 0n && (
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
                            leftSection={
                              <CurrencyDollarIcon className="h-3 w-3" />
                            }
                          >
                            {formatSTRK(round.userTicket.reward)}
                          </Badge>
                        </Group>
                      )}
                  </Stack>
                </Card>
              );
            })
          )}
        </Stack>
      </Card.Section>
    </Card>
  );
}
