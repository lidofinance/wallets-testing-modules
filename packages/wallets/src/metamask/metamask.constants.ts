import { CommonWalletConfig, WalletConnectTypes } from '../wallets.constants';

export const METAMASK_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'metamask',
  EXTENSION_WALLET_NAME: 'metamask',
  CONNECTED_WALLET_NAME: 'MetaMask',
  CONNECT_BUTTON_NAME: 'MetaMask',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  WALLET_TYPE: WalletConnectTypes.EOA,
  // MetaMask removed the experimental "Select networks for each site" feature,
  // which broke the unsupported chain tests flow.
  // Use this version if you need to handle unsupported chain tests.
  // https://github.com/MetaMask/metamask-extension/releases/tag/v12.11.0
  LATEST_STABLE_DOWNLOAD_LINK: null,
  EXTENSION_START_PATH: '/home.html',
};
