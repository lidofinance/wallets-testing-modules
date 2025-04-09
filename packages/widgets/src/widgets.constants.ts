export interface StakeConfig {
  stakeAmount: number;
  tokenAddress?: string;
  mappingSlot?: number;
}

export interface WidgetConfig {
  url: string;
  nodeUrl: string;
  name: string;
  networkName: string;
  stakeContract: string;
  wrapContract?: string;
  chainId?: number;
  chainName?: string;
  tokenSymbol?: string;
}
