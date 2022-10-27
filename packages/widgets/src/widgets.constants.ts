export interface StakeConfig {
  stakeAmount: number;
  tokenAddress?: string;
  mappingSlot?: number;
}

export interface WidgetConfig {
  url: string;
  nodeUrl: string;
  name: string;
  stake_contract: string;
  wrap_contract: string;
}
