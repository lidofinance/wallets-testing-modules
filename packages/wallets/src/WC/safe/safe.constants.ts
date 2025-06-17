import { CommonWalletConfig, WalletTypes } from '../../wallets.constants';

export const WC_SAFE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'safeWc',
  EXTENSION_WALLET_NAME: 'metamask',
  CONNECTED_WALLET_NAME: 'WalletConnect',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  CONNECT_BUTTON_NAME: 'WalletConnect',
  WALLET_TYPE: WalletTypes.WC,
  LATEST_STABLE_DOWNLOAD_LINK: null,
  EXTENSION_START_PATH: '/home.html',
};
