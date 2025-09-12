import { Card, Group, Text, Stack, Badge, Box } from '@mantine/core';
import { TicketIcon } from '@heroicons/react/24/outline';
import { RoundDetail } from '../../components/round-detail';

type RecentLotteryProps = {
  recentRoundIds: readonly number[];
};

export function RecentLottery(props: RecentLotteryProps) {
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
        <Stack gap="md">
          {props.recentRoundIds.length === 0 ? (
            <Box py="xl" ta="center">
              <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <Text c="dimmed" size="sm">
                No recent rounds available
              </Text>
            </Box>
          ) : (
            props.recentRoundIds.map((roundId) => (
              <RoundDetail key={roundId} roundId={roundId} compact={true} />
            ))
          )}
        </Stack>
      </Card.Section>
    </Card>
  );
}
