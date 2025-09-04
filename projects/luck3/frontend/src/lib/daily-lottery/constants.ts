export const CONTRACT_ADDRESSES = {
  lottery: import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  strkToken: import.meta.env.VITE_STRK_TOKEN_ADDRESS || '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
} as const;

export const NETWORK_CONFIG = {
  chainId: '0x534e5f5345504f4c4941', // Starknet Sepolia
  rpcUrl: import.meta.env.VITE_RPC_URL || 'https://free-rpc.nethermind.io/sepolia-juno',
  network: import.meta.env.VITE_STARKNET_NETWORK || 'sepolia-alpha',
} as const;

export const LOTTERY_CONFIG = {
  minGuess: 0,
  maxGuess: 99,
  ticketCost: BigInt('1000000000000000000'), // 1 STRK in wei
  dayInSeconds: 86400,
} as const;