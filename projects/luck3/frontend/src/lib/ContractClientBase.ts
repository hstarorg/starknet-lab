import {
  AccountInterface,
  Contract,
  ProviderInterface,
  RpcProvider,
  type Abi,
  type ArgsOrCalldata,
  type TypedContractV2,
} from 'starknet';
import type {
  ExtractAbiFunctionNames,
  FunctionArgs,
  InvokeOptions,
} from './kanabi';

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
}
