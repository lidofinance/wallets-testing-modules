import { CommonWalletConfig, WalletConnectTypes } from '../wallets.constants';

export const COINBASE_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'coinbase',
  EXTENSION_WALLET_NAME: 'coinbase',
  CONNECTED_WALLET_NAME: 'Browser',
  CONNECT_BUTTON_NAME: 'Browser',
  STORE_EXTENSION_ID: 'hnfanknocfeofbddgcijnmhnfnkdnaad',
  WALLET_TYPE: WalletConnectTypes.EOA,
  EXTENSION_START_PATH: '/index.html',
};
