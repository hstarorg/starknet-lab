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
import { TicketIcon } from '@heroicons/react/24/outline';
import { RoundDetail } from '@/pages/components/round-detail';

export function History() {
  const { store, snapshot } = useStore(HistoryStore);

  const { roundIds, loading } = snapshot;

  const hasMore = roundIds[roundIds.length - 1] > 1;

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
          <LoadingOverlay visible={loading && roundIds.length === 0} />
          <Stack gap="md">
            {roundIds.length === 0 && !loading ? (
              <Box py="xl" ta="center">
                <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <Text c="dimmed" size="sm">
                  No historical rounds available
                </Text>
              </Box>
            ) : (
              roundIds.map((roundId) => (
                <RoundDetail
                  key={roundId}
                  roundId={roundId}
                  showActions={true}
                />
              ))
            )}
          </Stack>

          {hasMore && roundIds.length > 0 && (
            <Box ta="center" mt="md">
              <Button
                onClick={store.loadMoreRounds}
                loading={loading}
                variant="light"
                color="blue"
                size="md"
              >
                Load More Rounds
              </Button>
            </Box>
          )}

          {!hasMore && roundIds.length > 0 && (
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
