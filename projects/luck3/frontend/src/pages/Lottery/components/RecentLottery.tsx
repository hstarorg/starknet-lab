import {
  Card,
  Group,
  Text,
  Stack,
  Badge,
  LoadingOverlay,
  Box,
} from '@mantine/core';
import { TicketIcon } from '@heroicons/react/24/outline';
import { RoundDetail } from '../../components/round-detail';
import type { RecentRoundInfo } from '../LotteryStore';

type RecentLotteryProps = {
  recentRounds: readonly RecentRoundInfo[];
  recentRoundsLoading?: boolean;
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
            props.recentRounds.map((round) => (
              <RoundDetail
                key={round.roundId.toString()}
                round={round}
                compact={true}
              />
            ))
          )}
        </Stack>
      </Card.Section>
    </Card>
  );
}
