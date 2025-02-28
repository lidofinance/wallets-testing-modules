import { CommonWalletConfig, WalletTypes } from '../../wallets.constants';

export const COIN98_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'coin98',
  CONNECTED_WALLET_NAME: 'Coin98',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'aeachknmefphepccionboohckonoeemg',
  CONNECT_BUTTON_NAME: 'Coin98',
  WALLET_TYPE: WalletTypes.EOA,
  EXTENSION_START_PATH: '/popup.html?expand=true',
};
