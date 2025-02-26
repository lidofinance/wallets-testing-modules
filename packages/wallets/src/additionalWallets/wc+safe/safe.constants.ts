import { CommonWalletConfig } from '../../wallets.constants';

export const SAFE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'metamask',
  CONNECTED_WALLET_NAME: 'WalletConnect',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  CONNECT_BUTTON_NAME: 'WalletConnect',
  SIMPLE_CONNECT: true,
  LATEST_STABLE_DOWNLOAD_LINK:
    'https://github.com/MetaMask/metamask-extension/releases/download/v12.10.4/metamask-chrome-12.10.4.zip',
  EXTENSION_START_PATH: '/home.html',
  ADDITIONAL_WALLET_NAME: 'safe',
};
