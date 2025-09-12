import { useStore } from '@/hooks';
import { HistoryStore } from './HistoryStore';
import { Text, LoadingOverlay, Box, Button, Grid } from '@mantine/core';
import { TicketIcon } from '@heroicons/react/24/outline';
import { RoundDetail } from '@/pages/components/round-detail';

export function History() {
  const { store, snapshot } = useStore(HistoryStore);

  const { roundIds, loading } = snapshot;

  const hasMore = roundIds[roundIds.length - 1] > 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Lottery History</h1>
        <p className="text-lg text-yellow-200">
          View all completed lottery rounds and their results
        </p>
      </div>

      <div className="backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <Text fw={500} size="lg" c="white">
            Historical Rounds
          </Text>
        </div>

        <LoadingOverlay visible={loading && roundIds.length === 0} />
        <Grid style={{ gridAutoRows: '1fr' }}>
          {roundIds.length === 0 && !loading ? (
            <Box py="xl" ta="center">
              <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <Text c="dimmed" size="sm">
                No historical rounds available
              </Text>
            </Box>
          ) : (
            roundIds.map((roundId) => (
              <Grid.Col
                span={{ base: 12, sm: 6, md: 6, lg: 4, xl: 4 }}
                key={roundId}
                h="100%"
              >
                <RoundDetail roundId={roundId} showActions={true} />
              </Grid.Col>
            ))
          )}
        </Grid>

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
      </div>
    </div>
  );
}
