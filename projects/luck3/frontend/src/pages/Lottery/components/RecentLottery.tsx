import { Card, Group, Text, Stack, Badge, LoadingOverlay, Divider } from '@mantine/core';
import { useStore } from '@/hooks';
import { LotteryStore } from '../LotteryStore';

export function RecentLottery() {
  const { snapshot } = useStore(LotteryStore);
  const { recentRounds, recentRoundsLoading } = snapshot;

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const formatPrizePool = (amount: bigint) => {
    // Convert from wei (assuming 18 decimals) to STRK
    const strkAmount = Number(amount) / 10 ** 18;
    return `${strkAmount.toFixed(2)} STRK`;
  };

  return (
    <Card withBorder shadow="sm" radius="md">
      <Card.Section inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500}>Recent Lottery</Text>
        </Group>
      </Card.Section>
      <Card.Section p="md">
        <LoadingOverlay visible={recentRoundsLoading} />
        <Stack gap="sm">
          {recentRounds.length === 0 && !recentRoundsLoading ? (
            <Text c="dimmed" ta="center" py="md">
              No recent rounds available
            </Text>
          ) : (
            recentRounds.map((round, index) => (
              <div key={round.roundId.toString()}>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>
                    Round #{round.roundId.toString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatDate(round.endTime)}
                  </Text>
                </Group>

                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed">Winning Number:</Text>
                  <Badge
                    color={round.winningNumber ? "green" : "gray"}
                    variant="light"
                  >
                    {round.winningNumber ?? "Pending"}
                  </Badge>
                </Group>

                {round.prizePool > 0n && (
                  <Group justify="space-between" mb="xs">
                    <Text size="xs" c="dimmed">Prize Pool:</Text>
                    <Text size="xs" fw={500}>
                      {formatPrizePool(round.prizePool)}
                    </Text>
                  </Group>
                )}

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">Your Bet:</Text>
                  {round.userTicket ? (
                    <Group gap="xs">
                      <Badge
                        color={round.userTicket.isWinner ? "green" : "blue"}
                        variant="light"
                      >
                        {round.userTicket.guess}
                      </Badge>
                      {round.userTicket.isWinner && (
                        <Badge color="green" variant="filled">
                          Winner!
                        </Badge>
                      )}
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">No bet</Text>
                  )}
                </Group>

                {index < recentRounds.length - 1 && <Divider my="sm" />}
              </div>
            ))
          )}
        </Stack>
      </Card.Section>
    </Card>
  );
}
