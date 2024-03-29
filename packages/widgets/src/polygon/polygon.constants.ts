import { WidgetConfig } from '../widgets.constants';

export const POLYGON_WIDGET_CONFIG: WidgetConfig = {
  url: 'https://polygon.lido.fi',
  nodeUrl: '**/api/rpc?chainId=1',
  isDefaultNetwork: true,
  name: 'polygon',
  networkName: 'Ethereum',
  stakeContract: '',
  chainName: 'Mainnet',
  chainId: 1,
  tokenSymbol: 'ETH',
};
