# Node Module

Module for using local ganache node with playwright helpers

## Install

```bash
yarn add @lidofinance/wallets-testing-nodes
```

## Usage

Import this module and provide `rpcUrl` parameter via factory

```ts
@Module({
    imports: [
        NodeModule.forRoot(
            (configService: ConfigService) => {
                return { rpcUrl: configService.get('RPC_URL') };
            },
            [ConfigService],
            [ConfigModule],
        ),
    ],
})
export class MyModule {}

// Usage
export class MyService {
  constructor(private ethereumNodeService: EthereumNodeService) {}

  async myMethod() {
     await this.ethereumNodeService.startNode();
     const state = await this.ethereumNodeService.state;
     expect(state).toBeDefined()
     await this.ethereumNodeService.stopNode();
  }
}
```
