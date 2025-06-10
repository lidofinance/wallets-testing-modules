import { CommonWalletConfig, WalletConnectTypes } from '../wallets.constants';

export const EXODUS_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'exodus',
  EXTENSION_WALLET_NAME: 'exodus',
  CONNECTED_WALLET_NAME: 'Browser',
  CONNECT_BUTTON_NAME: 'Browser',
  RPC_URL_PATTERN: '',
  STORE_EXTENSION_ID: 'aholpfdialjgjfhomihkjbmgjidlcdno',
  WALLET_TYPE: WalletConnectTypes.EOA,
  EXTENSION_START_PATH: '/onboarding.html',
};
