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

interface StarknetProviderProps {
  children: ReactNode;
}

export function StarknetProvider({ children }: StarknetProviderProps) {
  const { connectors } = useInjectedConnectors({
    recommended: [ready(), braavos()],
    includeRecommended: 'always',
    order: 'alphabetical',
  });

  const chains = [sepolia, mainnet];

  return (
    <StarknetConfig
      chains={chains}
      provider={publicProvider()}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
