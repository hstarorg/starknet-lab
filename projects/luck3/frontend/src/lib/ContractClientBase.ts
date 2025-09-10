import {
  AccountInterface,
  Contract,
  ProviderInterface,
  RpcProvider,
  type Abi,
  type ArgsOrCalldata,
  type TypedContractV2,
  type InvokeOptions,
  type Call,
  type BigNumberish,
} from 'starknet';
import type {
  ExtractAbiFunctionNames,
  FunctionArgs,
} from 'abi-wan-kanabi/kanabi';

export abstract class ContractClientBase<TAbi extends Abi> {
  protected contract: TypedContractV2<TAbi>;
  protected provider: RpcProvider;

  constructor(options: {
    contractAddress: string;
    abi: TAbi;
    rpcUrl?: string;
  }) {
    this.provider = new RpcProvider({
      nodeUrl: options.rpcUrl,
    });

    this.contract = new Contract(
      options.abi,
      options.contractAddress,
      this.provider
    ).typedv2(options.abi);
  }

  call<TFunctionName extends ExtractAbiFunctionNames<TAbi>>(
    method: TFunctionName,
    args?: FunctionArgs<TAbi, TFunctionName>
  ) {
    return this.contract.call(method, args as any);
  }

  invoke(
    account: ProviderInterface | AccountInterface,
    method: string,
    args?: ArgsOrCalldata,
    options?: InvokeOptions
  ) {
    this.contract.connect(account);
    return this.contract.invoke(method, args, options);
  }

  async multicall(calls: Call[], account: AccountInterface) {
    const multiCall = await account.execute(calls);
    console.log('MultiCall transaction hash:', multiCall.transaction_hash);
    return await this.provider.waitForTransaction(multiCall.transaction_hash);
  }

  async waitForTransaction(txHash: BigNumberish) {
    return await this.provider.waitForTransaction(txHash, {});
  }
}
