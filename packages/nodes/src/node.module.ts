import { DynamicModule, Module } from '@nestjs/common';
import { EthereumNodeService } from './ethereum.node.service';
import { OPTIONS } from './node.constants';

@Module({})
export class NodeModule {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  static forRoot(
    useFactory: (...args: any[]) => { rpcUrl: string },
    inject?: any[],
    imports?: any[],
  ): DynamicModule {
    return {
      imports: imports,
      module: NodeModule,
      providers: [
        {
          provide: OPTIONS,
          useFactory: useFactory,
          inject: inject,
        },
        EthereumNodeService,
      ],
      exports: [EthereumNodeService],
    };
  }
}
