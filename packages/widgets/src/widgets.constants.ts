export interface StakeConfig {
  stakeAmount: number;
  tokenAddress?: string;
  mappingSlot?: number;
}

export interface WidgetConfig {
  url: string;
  nodeUrl: string;
  isDefaultNetwork: boolean; // set true if the network exist in web3 extension.To set true fill in chainId,chainName,tokenSymbol
  name: string;
  networkName: string;
  stakeContract: string;
  wrapContract?: string;
  chainId?: number;
  chainName?: string;
  tokenSymbol?: string;
}
