import { CommonWalletConfig } from '../wallets.constants';

export const METAMASK_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'metamask',
  RPC_URL_PATTERN: 'https://mainnet.infura.io/v3/**',
  STORE_EXTENSION_ID: 'nkbihfbeogaeaoehlefnkodbefgpgknn',
  CONNECT_BUTTON_NAME: 'Metamask',
  SIMPLE_CONNECT: false,
  EXTENSION_START_PATH: '/home.html',
  TESTNET_NETWORK: 'Goerli',
};
