import {
  Connector,
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
} from '@starknet-react/core';
import {
  type StarknetkitConnector,
  useStarknetkitConnectModal,
} from 'starknetkit';
import { Button, Menu } from '@mantine/core';
import { Copy, LogOut } from 'lucide-react';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

export function ConnectButton() {
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();

  const { connect, connectors } = useConnect();
  const { starknetkitConnectModal } = useStarknetkitConnectModal({
    connectors: connectors as StarknetkitConnector[],
  });
  const { address } = useAccount();
  const { copy } = useClipboard();

  async function connectWallet() {
    const { connector } = await starknetkitConnectModal();
    if (!connector) {
      return;
    }
    connect({ connector: connector as Connector });
  }

  function copyAddress() {
    if (address) {
      copy(address);
      notifications.show({ message: 'Address copied to clipboard' });
    }
  }

  if (!address) {
    return (
      <Button variant="filled" onClick={connectWallet}>
        Connect Wallet
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Menu trigger="click-hover" position="bottom-end">
        <Menu.Target>
          <div className="flex rounded overflow-hidden leading-[36px] bg-gray-500 text-white">
            <div className="px-2">{chain?.network}</div>
            <div className="px-2 bg-gray-700">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item onClick={copyAddress}>
            <Copy size="14" className="inline-block" /> Copy Address
          </Menu.Item>
          <Menu.Item onClick={() => disconnect()}>
            <LogOut size="14" className="inline-block" /> Disconnect
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}
