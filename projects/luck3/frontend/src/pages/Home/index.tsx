import { useNavigate } from 'react-router-dom';
import { HomeStore } from './HomeStore';
import { useStore } from '@/hooks';
import { AppConf } from '@/constants';

const { LOTTERY_CONFIG } = AppConf;

export function Home() {
  const navigate = useNavigate();
  const { snapshot } = useStore(HomeStore);

  const handleJoinLottery = () => {
    navigate('/lottery');
  };

  const currentRound = snapshot.currentRound;

  return (
    <div className="relative min-h-[calc(100vh-200px)] ">
      {/* 丰富的背景装饰系统 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 大型装饰圆 */}
        <div className="absolute top-20 -right-20 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse"></div>
        <div className="absolute bottom-20 -left-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-8 animate-pulse animation-delay-4000"></div>

        {/* 中型装饰元素 */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-lg opacity-10 animate-bounce animation-delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-40 h-40 bg-cyan-400 rounded-full mix-blend-multiply filter blur-lg opacity-12 animate-pulse animation-delay-3000"></div>

        {/* 小型装饰点 */}
        <div className="absolute top-16 left-16 w-8 h-8 bg-yellow-300 rounded-full opacity-20 animate-ping animation-delay-500"></div>
        <div className="absolute top-3/4 right-12 w-6 h-6 bg-green-300 rounded-full opacity-25 animate-ping animation-delay-1500"></div>
        <div className="absolute bottom-12 left-1/4 w-10 h-10 bg-orange-300 rounded-full opacity-15 animate-ping animation-delay-2500"></div>

        {/* 几何形状装饰 */}
        <div
          className="absolute top-1/3 left-12 w-20 h-20 border-2 border-white/10 rotate-45 animate-spin"
          style={{ animationDuration: '20s' }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/3 w-16 h-16 border border-cyan-300/20 rotate-12 animate-spin"
          style={{ animationDuration: '15s', animationDirection: 'reverse' }}
        ></div>

        {/* 渐变网格背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse animation-delay-5000"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-pulse animation-delay-7000"></div>

        {/* 粒子效果 */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 主要宣传区 */}
        <div className="text-center mb-16">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
            <span className="text-yellow-300 font-semibold text-sm uppercase tracking-wide">
              🎰 LUCK3 Lottery
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Win{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              STRK
            </span>{' '}
            Every Day!
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            🎯 Guess a number between{' '}
            <strong className="text-white">
              {LOTTERY_CONFIG.minGuess}-{LOTTERY_CONFIG.maxGuess}
            </strong>{' '}
            and share in the daily prize pool.
            <br />
            <span className="text-green-400 font-semibold">
              Only 1 STRK per ticket!
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {snapshot.isLoading ? (
              <div className="bg-gray-500 text-white font-bold py-4 px-8 rounded-full text-lg">
                🔄 Loading...
              </div>
            ) : snapshot.currentRound ? (
              <button
                onClick={handleJoinLottery}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
              >
                🎯 Join Lottery
              </button>
            ) : (
              <div className="bg-gray-500 text-white font-bold py-4 px-8 rounded-full text-lg">
                ⏳ No Active Round - Please Wait
              </div>
            )}
            <div className="text-gray-400 text-sm">
              ⚡ Powered by Starknet • 100% On-Chain
            </div>
          </div>
        </div>

        {/* 条件渲染：有有效轮次时显示统计，没有时显示等待信息 */}
        {snapshot.isLoading ? (
          <div className="text-center mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
              <div className="text-6xl mb-4">🔄</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Loading Lottery Data
              </h3>
              <p className="text-gray-400">
                Please wait while we fetch the latest information...
              </p>
            </div>
          </div>
        ) : snapshot.currentRound ? (
          <>
            {/* 实时统计 */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Live Statistics
              </h2>
              <p className="text-gray-400">
                Current round information updated in real-time
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl mb-2">⏰</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {snapshot.timeRemaining}
                </div>
                <div className="text-gray-400 text-sm">Time Remaining</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {currentRound?.prizePool}
                </div>
                <div className="text-gray-400 text-sm">STRK Prize Pool</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl mb-2">🎫</div>
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {currentRound?.totalTickets}
                </div>
                <div className="text-gray-400 text-sm">Tickets</div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {currentRound?.totalTickets}
                </div>
                <div className="text-gray-400 text-sm">Participants</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
              <div className="text-6xl mb-4">⏳</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No Active Lottery Round
              </h3>
              <p className="text-gray-400 mb-6">
                There is currently no active lottery round. Please wait for the
                next round to begin.
              </p>
              <div className="text-sm text-gray-300">
                New rounds are typically created automatically. Check back soon!
              </div>
            </div>
          </div>
        )}

        {/* 奖金池统计 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Statistics Information
          </h2>
          <p className="text-gray-400">
            Current and accumulated prize pool statistics
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {snapshot.totalRounds}
            </div>
            <div className="text-gray-400 text-sm">Total Rounds</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold text-pink-400 mb-1">
              {snapshot.accumulatedPrizePool?.toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Accumulated Pool</div>
          </div>
        </div>

        {/* 特性展示 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="text-xl font-bold text-white mb-3">
              Daily Fair Draw
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Every day at midnight, winners are selected automatically using
              blockchain randomness. No manipulation, completely fair.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-3">
              Secure & Transparent
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Built on Starknet with Cairo smart contracts. Every transaction is
              verifiable on the blockchain. Your funds are always safe.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-3">
              Instant Rewards
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Winners can claim their STRK rewards immediately after the draw.
              No waiting periods, instant payouts to your wallet.
            </p>
          </div>
        </div>

        {/* 如何参与 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            How to Play
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                1
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Connect Wallet
              </h4>
              <p className="text-gray-400">
                Connect your Starknet wallet to participate
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                2
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Buy Ticket
              </h4>
              <p className="text-gray-400">
                Choose a number {LOTTERY_CONFIG.minGuess}-
                {LOTTERY_CONFIG.maxGuess} and pay 1 STRK
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-pink-500 to-red-500 rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                3
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Win & Claim
              </h4>
              <p className="text-gray-400">
                If you guess right, claim your share of the prize pool
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
