import { CommonWalletConfig, WalletConnectTypes } from '../wallets.constants';

export const COIN98_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'coin98',
  EXTENSION_WALLET_NAME: 'coin98',
  CONNECTED_WALLET_NAME: 'Browser',
  CONNECT_BUTTON_NAME: 'Browser',
  STORE_EXTENSION_ID: 'aeachknmefphepccionboohckonoeemg',
  WALLET_TYPE: WalletConnectTypes.EOA,
  EXTENSION_START_PATH: '/tabs/extension.html?expand=true',
};
