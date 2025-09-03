import { Contract, RpcProvider } from 'starknet'
import lotteryAbi from '../abi/lottery.json'

const CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || ''

const provider = new RpcProvider({
  nodeUrl: import.meta.env.VITE_RPC_URL || 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7'
})

export const lotteryContract = new Contract(lotteryAbi, CONTRACT_ADDRESS, provider)

export async function getCurrentRound(): Promise<number> {
  try {
    const result = await lotteryContract.get_current_round()
    return Number(result)
  } catch (error) {
    console.error('Error getting current round:', error)
    throw error
  }
}

export async function getRoundInfo(roundId: number) {
  try {
    const result = await lotteryContract.get_round_info(roundId)
    return {
      roundId: Number(result[0]),
      prizePool: result[1].toString(),
      endTime: Number(result[2]),
      winner: result[3],
      isDrawn: result[4]
    }
  } catch (error) {
    console.error('Error getting round info:', error)
    throw error
  }
}

export async function getUserBet(roundId: number, userAddress: string) {
  try {
    const result = await lotteryContract.get_user_bet(roundId, userAddress)
    return {
      amount: result[0].toString(),
      numbers: result[1].map((n: bigint) => Number(n))
    }
  } catch (error) {
    console.error('Error getting user bet:', error)
    throw error
  }
}

export async function placeBet(numbers: number[], amount: string, account: any) {
  try {
    const contract = new Contract(lotteryAbi, CONTRACT_ADDRESS, account)
    const result = await contract.place_bet(numbers, {
      amount
    })
    return result
  } catch (error) {
    console.error('Error placing bet:', error)
    throw error
  }
}

export async function drawWinner(account: any) {
  try {
    const contract = new Contract(lotteryAbi, CONTRACT_ADDRESS, account)
    const result = await contract.draw_winner()
    return result
  } catch (error) {
    console.error('Error drawing winner:', error)
    throw error
  }
}