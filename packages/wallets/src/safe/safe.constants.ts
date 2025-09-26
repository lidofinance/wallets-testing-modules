import { CommonWalletConfig, WalletConnectTypes } from '../wallets.constants';
import { METAMASK_LATEST_COMMON_CONFIG } from '../metamask';

export const WC_SAFE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'safeWc',
  EXTENSION_WALLET_NAME: METAMASK_LATEST_COMMON_CONFIG.EXTENSION_WALLET_NAME,
  CONNECTED_WALLET_NAME: 'WalletConnect',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  CONNECT_BUTTON_NAME: 'WalletConnect',
  WALLET_TYPE: WalletConnectTypes.WC,
  LATEST_STABLE_DOWNLOAD_LINK: null,
  EXTENSION_START_PATH: '/home.html',
};

export const IFRAME_SAFE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'safeIframe',
  EXTENSION_WALLET_NAME: METAMASK_LATEST_COMMON_CONFIG.EXTENSION_WALLET_NAME,
  CONNECTED_WALLET_NAME: 'Safe',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  CONNECT_BUTTON_NAME: '', // auto connection
  WALLET_TYPE: WalletConnectTypes.IFRAME,
  LATEST_STABLE_DOWNLOAD_LINK: null,
  EXTENSION_START_PATH: '/home.html',
};
