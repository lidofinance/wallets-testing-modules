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

const ETHEREUM_WIDGET_CONFIG: WidgetConfig = {
  url: 'https://stake.lido.fi',
  nodeUrl: '**/api/rpc?chainId=1',
  name: 'ethereum',
  network: NETWORKS_CONFIG.mainnet.ETHEREUM,
  stakeContract: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  wrapContract: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
};

const HOODI_WIDGET_CONFIG: WidgetConfig = {
  url: 'https://stake-hoodi.testnet.fi',
  nodeUrl: '',
  name: 'hoodi',
  network: NETWORKS_CONFIG.testnet.ETHEREUM_HOODI,
  stakeContract: '0x3508A952176b3c15387C97BE809eaffB1982176a',
  wrapContract: '0x7E99eE3C66636DE415D2d7C880938F2f40f94De4',
};

export const widgetConfig = {
  'Ethereum Mainnet': ETHEREUM_WIDGET_CONFIG,
  'Ethereum Hoodi': HOODI_WIDGET_CONFIG,
};
