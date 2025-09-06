import { ContractClientBase } from '../ContractClientBase';
import { ABI } from './abi';

export class ERC20ContractClient extends ContractClientBase<typeof ABI> {
  constructor(contractAddress: string, rpcUrl?: string) {
    super({
      contractAddress,
      abi: ABI,
      rpcUrl,
    });
  }

  async balanceOf(userAddress: string) {
    const balance = await this.contract.balance_of(userAddress);
    return balance as bigint;
  }

  async allowance(userAddress: string, spenderAddress: string) {
    const allowance = await this.contract.allowance(
      userAddress,
      spenderAddress
    );
    return allowance as bigint;
  }

  async approve(spenderAddress: string, amount: bigint): Promise<string> {
    const tx = await this.contract.approve(spenderAddress, amount);
    return (tx as any).transaction_hash;
  }
}
