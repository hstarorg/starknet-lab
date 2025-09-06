import type { ReactNode } from 'react';
import {
  StarknetConfig,
  publicProvider,
  braavos,
  useInjectedConnectors,
  voyager,
  ready,
} from '@starknet-react/core';
import { mainnet, sepolia } from '@starknet-react/chains';
import { AppEnvs } from '@/constants';

interface StarknetProviderProps {
  children: ReactNode;
}

export function StarknetProvider({ children }: StarknetProviderProps) {
  const { connectors } = useInjectedConnectors({
    recommended: [ready(), braavos()],
    includeRecommended: 'always',
    order: 'alphabetical',
  });

  const chains = AppEnvs.isProduction ? [mainnet] : [sepolia];

  return (
    <StarknetConfig
      chains={chains}
      provider={publicProvider()}
      connectors={connectors}
      explorer={voyager}
      autoConnect={true}
    >
      {children}
    </StarknetConfig>
  );
}
