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
import { useAccount } from '@starknet-react/core';
import { useEffect } from 'react';

export function History() {
  const { store, snapshot } = useStore(HistoryStore);
  const { address, account } = useAccount();

  const { rounds, loading, hasMore } = snapshot;

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

  const handleClaimReward = (roundId: number) => {
    store.claimReward(roundId);
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
              rounds.map((round) => (
                <RoundDetail
                  key={round.roundId.toString()}
                  round={round}
                  showActions={true}
                  onClaimReward={handleClaimReward}
                />
              ))
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
