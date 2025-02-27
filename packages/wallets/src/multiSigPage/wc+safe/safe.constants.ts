import { CommonWalletConfig } from '../../wallets.constants';
import { METAMASK_COMMON_CONFIG } from '../../wallets/metamask';

export const SAFE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'safe',
  CONNECTED_WALLET_NAME: 'WalletConnect',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: METAMASK_COMMON_CONFIG.STORE_EXTENSION_ID,
  CONNECT_BUTTON_NAME: 'WalletConnect',
  WALLET_TYPE: 'WC',
  LATEST_STABLE_DOWNLOAD_LINK: '',
  EXTENSION_START_PATH: METAMASK_COMMON_CONFIG.EXTENSION_START_PATH,
  ADDITIONAL_WALLET_NAME: METAMASK_COMMON_CONFIG.WALLET_NAME, // Wallet name if we use not default wallet
};
