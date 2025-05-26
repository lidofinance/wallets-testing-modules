import { CommonWalletConfig, WalletConnectTypes } from '../wallets.constants';

export const CTRL_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'ctrl',
  EXTENSION_WALLET_NAME: 'ctrl',
  CONNECTED_WALLET_NAME: 'Ctrl',
  CONNECT_BUTTON_NAME: 'Ctrl',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'hmeobnfnfcmdkdcmlblgagmfpfboieaf',
  WALLET_TYPE: WalletConnectTypes.EOA,
  EXTENSION_START_PATH: '/popup.html',
};
