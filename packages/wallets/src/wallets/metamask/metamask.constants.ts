import { CommonWalletConfig } from '../../wallets.constants';

export const METAMASK_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'metamask',
  CONNECTED_WALLET_NAME: 'MetaMask',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  CONNECT_BUTTON_NAME: 'MetaMask',
  SIMPLE_CONNECT: false,
  LATEST_STABLE_DOWNLOAD_LINK:
    'https://github.com/MetaMask/metamask-extension/releases/download/v12.10.4/metamask-chrome-12.10.4.zip',
  EXTENSION_START_PATH: '/home.html',
};
