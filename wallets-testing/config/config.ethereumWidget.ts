import {
  NetworkConfig,
  NETWORKS_CONFIG,
} from '@lidofinance/wallets-testing-wallets';

export interface WidgetConfig {
  url: string;
  nodeUrl: string;
  name: string;
  network: NetworkConfig;
  stakeContract: string;
  wrapContract?: string;
}

export const ETHEREUM_WIDGET_CONFIG: WidgetConfig = {
  url: 'https://stake.lido.fi',
  nodeUrl: '**/api/rpc?chainId=1',
  name: 'ethereum',
  network: NETWORKS_CONFIG.Mainnet.ETHEREUM,
  stakeContract: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  wrapContract: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
};
