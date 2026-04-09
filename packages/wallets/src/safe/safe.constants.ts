import { CommonWalletConfig, WalletConnectTypes } from '../wallets.constants';
import { WC_SDK_COMMON_CONFIG } from '../walletConnect';

export const WC_SAFE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'safeWc',
  EXTENSION_WALLET_NAME: WC_SDK_COMMON_CONFIG.WALLET_NAME,
  CONNECTED_WALLET_NAME: 'WalletConnect',
  STORE_EXTENSION_ID: null,
  CONNECT_BUTTON_NAME: 'WalletConnect',
  SAFE_CONNECT_BUTTON_NAME: 'WalletConnect',
  WALLET_TYPE: WalletConnectTypes.WC_EOA,
  LATEST_STABLE_DOWNLOAD_LINK: null,
  EXTENSION_START_PATH: '/home.html',
};

export const IFRAME_SAFE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'safeIframe',
  EXTENSION_WALLET_NAME: WC_SDK_COMMON_CONFIG.WALLET_NAME,
  CONNECTED_WALLET_NAME: 'Safe',
  STORE_EXTENSION_ID: null,
  CONNECT_BUTTON_NAME: '', // auto connection
  SAFE_CONNECT_BUTTON_NAME: 'WalletConnect',
  WALLET_TYPE: WalletConnectTypes.IFRAME,
  LATEST_STABLE_DOWNLOAD_LINK: null,
  EXTENSION_START_PATH: '/home.html',
};
