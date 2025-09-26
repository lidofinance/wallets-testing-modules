import {
  CommonWalletConfig,
  WalletConnectTypes,
} from '../../wallets.constants';

export const METAMASK_LATEST_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'metamask',
  EXTENSION_WALLET_NAME: 'metamask',
  CONNECTED_WALLET_NAME: 'MetaMask',
  CONNECT_BUTTON_NAME: 'MetaMask',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  WALLET_TYPE: WalletConnectTypes.EOA,
  // Metamask stable version
  // https://github.com/MetaMask/metamask-extension/releases/tag/v12.10.4
  LATEST_STABLE_DOWNLOAD_LINK: null,
  EXTENSION_START_PATH: '/home.html',
};
