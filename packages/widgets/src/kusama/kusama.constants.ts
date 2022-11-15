import { WidgetConfig } from '../widgets.constants';

export const KUSAMA_WIDGET_CONFIG: WidgetConfig = {
  url: 'https://kusama.lido.fi/',
  nodeUrl: 'https://rpc.moonriver.moonbeam.network',
  isDefaultNetwork: false,
  name: 'kusama',
  stakeContract: '0xffc7780c34b450d917d557e728f033033cb4fa8c',
  wrapContract: '',
  chainId: 1285,
  chainName: 'Moonriver',
  tokenSymbol: 'MOVR',
};
