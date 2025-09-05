export const AppEnvs = {
  Luck3ContractAddress: import.meta.env.VITE_LUCK3_CONTRACT_ADDRESS as string,
  rpcUrl: import.meta.env.VITE_RPC_URL as string,
};

export const AppConf = {
  LOTTERY_CONFIG: {
    minGuess: 10,
    maxGuess: 99,
    ticketCost: BigInt('1000000000000000000'), // 1 STRK in wei
    dayInSeconds: 86400,
  } as const,
};
