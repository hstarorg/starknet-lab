import {
  Card,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Divider,
} from '@mantine/core';
import {
  Ticket,
  Clock,
  Coins,
  Check,
  X,
  Trophy,
} from 'lucide-react';
import type { UserTicket } from '@/types/lottery.type';

interface TicketItemProps {
  ticket: UserTicket;
  onClaimReward?: (roundId: bigint) => void;
  isCurrentRound?: boolean;
}

export function TicketItem({ onClaimReward, ticket, isCurrentRound = false }: TicketItemProps) {
  const formatSTRK = (amount: bigint) => {
    return (Number(amount) / 1e18).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    });
  };

  const getTicketStatus = () => {
    if (!ticket) return 'no_ticket';
    if (ticket.isWinner && !ticket.claimed) return 'won_unclaimed';
    if (ticket.isWinner && ticket.claimed) return 'won_claimed';
    if (!ticket.isWinner) return 'lost';
    return 'pending';
  };

  const getStatusDisplay = () => {
    // 如果是当前轮次，不显示中奖结果
    if (isCurrentRound) {
      return {
        icon: <Ticket size={32} color="blue" />,
        title: '🎫 Your Current Ticket',
        description: 'Waiting for the draw results...',
        color: 'blue',
        variant: 'light' as const,
        button: null,
        showReward: false,
      };
    }

    const status = getTicketStatus();

    switch (status) {
      case 'won_unclaimed':
        return {
          icon: <Trophy size={32} color="green" />,
          title: '🎉 You Won!',
          description: `Congratulations! You won ${formatSTRK(ticket.reward)} STRK`,
          color: 'green',
          variant: 'light' as const,
          button: (
            <Button
              onClick={() => onClaimReward?.(ticket.roundId)}
              color="green"
              size="sm"
              leftSection={<Coins size={16} />}
            >
              Claim Reward
            </Button>
          ),
          showReward: true,
        };

      case 'won_claimed':
        return {
          icon: <Check size={32} color="blue" />,
          title: '✅ Reward Claimed',
          description: `You successfully claimed ${formatSTRK(ticket.reward)} STRK`,
          color: 'blue',
          variant: 'light' as const,
          button: null,
          showReward: true,
        };

      case 'lost':
        return {
          icon: <X size={32} color="red" />,
          title: '❌ Not a Winner',
          description: 'Better luck next time!',
          color: 'red',
          variant: 'light' as const,
          button: null,
          showReward: false,
        };

      case 'pending':
        return {
          icon: <Clock size={32} color="orange" />,
          title: '⏳ Round in Progress',
          description: 'Waiting for the draw results...',
          color: 'orange',
          variant: 'light' as const,
          button: null,
          showReward: false,
        };

      default:
        return {
          icon: <Ticket size={32} color="gray" />,
          title: '🎫 Your Ticket',
          description: 'Ticket purchased successfully',
          color: 'gray',
          variant: 'light' as const,
          button: null,
          showReward: false,
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <Card withBorder shadow="sm" radius="md" padding="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            {statusDisplay.icon}
            <div>
              <Text size="lg" fw={600}>
                {statusDisplay.title}
              </Text>
              <Text size="sm" c="dimmed">
                {statusDisplay.description}
              </Text>
            </div>
          </Group>
          {statusDisplay.button}
        </Group>

        <Divider />

        <Group justify="space-between" align="center">
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Round #{ticket.roundId.toString()}
            </Text>
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                Your Guess:
              </Text>
              <Badge
                size="lg"
                variant="filled"
                color={statusDisplay.color}
              >
                {ticket.guess}
              </Badge>
            </Group>
          </Stack>

          {statusDisplay.showReward && ticket.isWinner && (
            <Stack gap="xs" align="center">
              <Text size="sm" c="dimmed">
                Reward
              </Text>
              <Badge
                size="lg"
                variant="filled"
                color="green"
                leftSection={<Coins size={14} />}
              >
                {formatSTRK(ticket.reward)} STRK
              </Badge>
            </Stack>
          )}
        </Group>

        {ticket.isWinner && ticket.claimed && (
          <Group justify="center">
            <Badge
              color="blue"
              variant="filled"
              size="sm"
              leftSection={<Check size={12} />}
            >
              Reward Claimed
            </Badge>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
