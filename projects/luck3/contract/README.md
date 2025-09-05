# Contract

```bash
# Deploy class
source .env && starkli declare target/dev/luck3_DailyLottery.contract_class.json --network=sepolia

# Deploy contract: starkli deploy <CLASS_HASH> <CONSTRUCTOR_INPUTS> --network=sepolia
starkli deploy <class hash> <inputs> --network=sepolia
# for exmaple:
starkli deploy 0x0710a6cc43ac842642eb4b5a541ee4631b53259460364366868b35dc07744810 0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D --network=sepolia

# Contract Read: starkli call <contract address> <function name> <inputs>
starkli call 0x061bfe2f84e7c8c5c1b35bd8aa6e1135b5a0554f1aedf051e222c1bf3548e321 get_current_round_info --network=sepolia

# Contract Write: starkli invoke <contract address> <function name> <inputs>
starkli invoke 0x061bfe2f84e7c8c5c1b35bd8aa6e1135b5a0554f1aedf051e222c1bf3548e321 increase_balance 1000000000000000000 --network=sepolia

# Generate abi file
starkli class-at "contract address" --network=sepolia | pnpx abi-wan-kanabi --input /dev/stdin --output abi.ts
# For exmaple:
starkli class-at "0x061bfe2f84e7c8c5c1b35bd8aa6e1135b5a0554f1aedf051e222c1bf3548e321" --network=sepolia | pnpx abi-wan-kanabi --input /dev/stdin --output abi.ts
```

## Deployment

### 2025-09-05 12:05:04

```bash
# Declare
Declaring Cairo 1 class: 0x0710a6cc43ac842642eb4b5a541ee4631b53259460364366868b35dc07744810
Compiling Sierra class to CASM with compiler version 2.11.4...
CASM class hash: 0x00d6b71412902ece9de3cdcac879b373ffb6c6af1d71cf29946c472e94cc5ef4
Contract declaration transaction: 0x079c7a4c1071864d6150f12da383b83636c29c18bd8310176d3e6b210786f6dd
Class hash declared:
0x0710a6cc43ac842642eb4b5a541ee4631b53259460364366868b35dc07744810

# Deploy
Deploying class 0x0710a6cc43ac842642eb4b5a541ee4631b53259460364366868b35dc07744810 with salt 0x0545646a1408789181eb3c0955816427e61e43dd9b0923d39f460d82d9cc674a...
The contract will be deployed at address 0x061bfe2f84e7c8c5c1b35bd8aa6e1135b5a0554f1aedf051e222c1bf3548e321
Contract deployment transaction: 0x078cd76582056fbd2cc9444af794f01d0eb234e497f242c363ce8297c1efd0e5
Contract deployed:
0x061bfe2f84e7c8c5c1b35bd8aa6e1135b5a0554f1aedf051e222c1bf3548e321
```
