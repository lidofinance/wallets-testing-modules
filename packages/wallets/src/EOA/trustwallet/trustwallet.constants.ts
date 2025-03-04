import { CommonWalletConfig, WalletTypes } from '../../wallets.constants';

export const TRUST_WALLET_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'trust',
  CONNECTED_WALLET_NAME: 'Trust',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'egjidjbpglichdcondbcbdnbeeppgdph',
  CONNECT_BUTTON_NAME: 'Trust',
  WALLET_TYPE: WalletTypes.EOA,
  EXTENSION_START_PATH: '/home.html',
};
