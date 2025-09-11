import { useStore } from '@/hooks';
import { HistoryStore } from './HistoryStore';
import {
  Card,
  Group,
  Text,
  Stack,
  Badge,
  LoadingOverlay,
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
import { useAccount } from '@starknet-react/core';
import { useEffect } from 'react';

export function History() {
  const { store, snapshot } = useStore(HistoryStore);
  const { address, account } = useAccount();

  const { rounds, loading, hasMore } = snapshot;

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Set account when it changes
  useEffect(() => {
    if (account) {
      store.setAccount(account);
    }
  }, [store, account]);

  // Load initial data when component mounts or address changes
  useEffect(() => {
    if (address && rounds.length === 0) {
      store.loadMoreRounds(address);
    }
  }, [store, address, rounds.length]);

  const getRoundStatus = (round: any) => {
    if (round.winningNumber) {
      return { status: 'completed', color: 'green', text: 'Completed' };
    }
    const now = Date.now() / 1000;
    const endTime = Number(round.endTime);
    if (now > endTime) {
      // Check if round has participants using totalTickets
      const hasParticipants = round.totalTickets > 0n;
      if (hasParticipants) {
        return { status: 'drawing', color: 'orange', text: 'Drawing' };
      } else {
        return { status: 'expired', color: 'gray', text: 'Expired' };
      }
    }
    return { status: 'active', color: 'blue', text: 'Active' };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Lottery History</h1>
        <p className="text-white/70">View all completed lottery rounds</p>
      </div>

      <Card withBorder shadow="sm" radius="md">
        <Card.Section inheritPadding py="xs">
          <Group justify="space-between">
            <Text fw={500}>Historical Rounds</Text>
            <Badge size="sm" variant="light" color="blue">
              Completed Rounds
            </Badge>
          </Group>
        </Card.Section>
        <Card.Section p="md">
          <LoadingOverlay visible={loading && rounds.length === 0} />
          <Stack gap="md">
            {rounds.length === 0 && !loading ? (
              <Box py="xl" ta="center">
                <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <Text c="dimmed" size="sm">
                  No historical rounds available
                </Text>
              </Box>
            ) : (
              rounds.map((round) => {
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

                      {/* User's Bet */}
                      <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                          Your Bet:
                        </Text>
                        {round.userTicket ? (
                          <Group gap="xs">
                            <Badge
                              size="sm"
                              color={
                                round.userTicket.isWinner ? 'green' : 'blue'
                              }
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
                        !round.userTicket?.claimed && (
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
                              {round.userTicket.reward}
                            </Badge>
                          </Group>
                        )}

                      {/* Action Buttons */}
                      <Group justify="space-between" align="center">
                        <Text size="xs" c="dimmed">
                          Actions:
                        </Text>
                        <Group gap="xs">
                          {round.userTicket?.isWinner &&
                            !round.userTicket?.claimed && (
                              <Button
                                size="xs"
                                variant="filled"
                                color="green"
                                onClick={() => {
                                  // TODO: Implement reward claiming
                                  console.log(
                                    'Claim reward for round',
                                    round.roundId
                                  );
                                }}
                              >
                                Claim Reward
                              </Button>
                            )}
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                );
              })
            )}
          </Stack>

          {hasMore && rounds.length > 0 && (
            <Box ta="center" mt="md">
              <Button
                onClick={() => store.loadMoreRounds(address)}
                loading={loading}
                variant="light"
                color="blue"
                size="md"
              >
                Load More Rounds
              </Button>
            </Box>
          )}

          {!hasMore && rounds.length > 0 && (
            <Box ta="center" mt="md">
              <Text c="dimmed" size="sm">
                No more rounds to load
              </Text>
            </Box>
          )}
        </Card.Section>
      </Card>
    </div>
  );
}
