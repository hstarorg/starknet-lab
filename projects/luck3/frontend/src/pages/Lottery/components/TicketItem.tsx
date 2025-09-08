import { Button } from '@mantine/core';
import { formatSTRK } from '@/utils';
import type { UserTicket } from '@/types/lottery.type';

interface TicketItemProps {
  ticket: UserTicket;
  onClaimReward?: (roundId: bigint) => void;
  isCurrentRound?: boolean;
}

export function TicketItem({ onClaimReward, ticket, isCurrentRound = false }: TicketItemProps) {
  const getTicketStatus = () => {
    if (!ticket) return 'no_ticket';
    if (ticket.isWinner && !ticket.claimed) return 'won_unclaimed';
    if (ticket.isWinner && ticket.claimed) return 'won_claimed';
    if (!ticket.isWinner) return 'lost';
    return 'pending';
  };

  const status = getTicketStatus();

  return (
    <div className="relative max-w-md mx-auto">
      {/* 彩票主体 - 纸张质感 */}
      <div className="relative bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 p-6 rounded-lg shadow-xl border-2 border-yellow-200 transform rotate-1 hover:rotate-0 transition-transform duration-300">

        {/* 装饰性边框 */}
        <div className="absolute inset-0 rounded-lg border border-yellow-300 opacity-50"></div>

        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 rounded-t-lg"></div>

        {/* 彩票标题 */}
        <div className="text-center mb-4 relative">
          <h3 className="text-2xl font-bold text-gray-800 mb-1">LUCKY LOTTO</h3>
          <div className="text-sm text-gray-600">Round #{Number(ticket.roundId)}</div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>

        {/* 撕票线效果 */}
        <div className="relative mb-4">
          <div className="border-t-2 border-dashed border-gray-400 my-2"></div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full border-2 border-gray-400 flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-gray-200">

          {/* 猜测号码 - 突出显示 */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-2">YOUR NUMBER</div>
            <div className="relative inline-block">
              <div className="text-6xl font-black text-red-600 drop-shadow-lg">
                {ticket.guess.toString().padStart(2, '0')}
              </div>
              {/* 装饰星星 */}
              <div className="absolute -top-2 -left-2 text-yellow-500 text-xl">⭐</div>
              <div className="absolute -top-2 -right-2 text-yellow-500 text-xl">⭐</div>
              <div className="absolute -bottom-2 -left-2 text-blue-500 text-xl">✨</div>
              <div className="absolute -bottom-2 -right-2 text-blue-500 text-xl">✨</div>
            </div>
          </div>

          {/* 状态信息 */}
          <div className="text-center">
            {isCurrentRound ? (
              <div className="space-y-2">
                <div className="text-lg font-semibold text-blue-600">⏳ ACTIVE TICKET</div>
                <div className="text-sm text-gray-600">Waiting for draw results...</div>
              </div>
            ) : status === 'won_unclaimed' ? (
              <div className="space-y-2">
                <div className="text-xl font-bold text-green-600">🎉 WINNER!</div>
                <div className="text-lg font-semibold text-green-700">
                  {formatSTRK(ticket.reward)} STRK
                </div>
                <Button
                  onClick={() => onClaimReward?.(ticket.roundId)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white border-0 mt-2"
                >
                  🎁 Claim Prize
                </Button>
              </div>
            ) : status === 'won_claimed' ? (
              <div className="space-y-2">
                <div className="text-xl font-bold text-blue-600">✅ CLAIMED</div>
                <div className="text-lg font-semibold text-blue-700">
                  {formatSTRK(ticket.reward)} STRK
                </div>
                <div className="text-sm text-gray-600">Prize collected successfully!</div>
              </div>
            ) : status === 'lost' ? (
              <div className="space-y-2">
                <div className="text-xl font-bold text-red-600">❌ NO WIN</div>
                <div className="text-sm text-gray-600">Better luck next round!</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-lg font-semibold text-orange-600">⏳ PENDING</div>
                <div className="text-sm text-gray-600">Round in progress...</div>
              </div>
            )}
          </div>
        </div>

        {/* 底部装饰 */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>Valid for Round #{Number(ticket.roundId)}</div>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-red-400 rounded-full"></div>
            <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
          </div>
        </div>

        {/* 右下角装饰 */}
        <div className="absolute bottom-2 right-2 text-4xl opacity-10">🎫</div>
      </div>

      {/* 阴影效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-lg transform translate-x-1 translate-y-1 -z-10 opacity-50"></div>
    </div>
  );
}
