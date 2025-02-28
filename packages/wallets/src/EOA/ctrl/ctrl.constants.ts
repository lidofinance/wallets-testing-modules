import { CommonWalletConfig, WalletTypes } from '../../wallets.constants';

export const CTRL_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'ctrl',
  CONNECTED_WALLET_NAME: 'Ctrl',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'hmeobnfnfcmdkdcmlblgagmfpfboieaf',
  CONNECT_BUTTON_NAME: 'Ctrl',
  WALLET_TYPE: WalletTypes.EOA,
  EXTENSION_START_PATH: '/popup.html',
};
