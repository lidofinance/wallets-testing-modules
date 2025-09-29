import {
  CommonWalletConfig,
  WalletConnectTypes,
} from '../../wallets.constants';

export const METAMASK_STABLE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'metamask',
  EXTENSION_WALLET_NAME: 'metamaskStable',
  CONNECTED_WALLET_NAME: 'MetaMask',
  CONNECT_BUTTON_NAME: 'MetaMask',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  WALLET_TYPE: WalletConnectTypes.EOA,
  // Metamask stable version
  // https://github.com/MetaMask/metamask-extension/releases/tag/v12.10.4
  LATEST_STABLE_DOWNLOAD_LINK:
    'https://github.com/MetaMask/metamask-extension/releases/download/v12.10.4/metamask-chrome-12.10.4.zip',
  EXTENSION_START_PATH: '/home.html',
};
