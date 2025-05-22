import { CommonWalletConfig, WalletTypes } from '../wallets.constants';

export const COIN98_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'coin98',
  EXTENSION_WALLET_NAME: 'coin98',
  CONNECTED_WALLET_NAME: 'Coin98',
  CONNECT_BUTTON_NAME: 'Coin98',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'aeachknmefphepccionboohckonoeemg',
  WALLET_TYPE: WalletTypes.EOA,
  EXTENSION_START_PATH: '/tabs/extension.html?expand=true',
};
