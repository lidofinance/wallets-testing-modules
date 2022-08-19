export const OPTIONS = 'RPC_NODE_OPTIONS';
export const ERC20_SHORT_ABI =
  '[{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]';

export type EthereumNodeServiceOptions = {
  rpcUrl: string;
  port?: number;
  chainId?: number;
  defaultBalance?: number;
};

export class ServiceUnreachableError extends Error {
  private cause: { message: string };
  constructor(error: { message: string }, options: any) {
    super(error.message + `\n${JSON.stringify(options)}`);
    this.cause = error;
  }
}
