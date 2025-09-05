import { ContractClientBase } from '../ContractClientBase';
import { ABI } from './abi';

export class Luck3ContractClient extends ContractClientBase<typeof ABI> {
  constructor(contractAddress: string, rpcUrl?: string) {
    super({
      contractAddress,
      abi: ABI,
      rpcUrl,
    });
  }

  async getCurrentRoundInfo() {
    return await this.contract.get_current_round_info();
  }
}
