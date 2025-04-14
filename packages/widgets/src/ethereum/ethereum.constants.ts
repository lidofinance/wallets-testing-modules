import { WidgetConfig } from '../widgets.constants';

export const ETHEREUM_WIDGET_CONFIG: WidgetConfig = {
  url: 'https://stake.lido.fi',
  nodeUrl: '**/api/rpc?chainId=1',
  name: 'ethereum',
  networkName: 'Ethereum',
  stakeContract: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  wrapContract: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
  chainName: 'Ethereum Mainnet',
  chainId: 1,
  tokenSymbol: 'ETH',
};
