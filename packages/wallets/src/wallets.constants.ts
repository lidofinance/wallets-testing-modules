export interface CommonWalletConfig {
  WALLET_NAME: string;
  CONNECTED_WALLET_NAME: string;
  RPC_URL_PATTERN: string;
  STORE_EXTENSION_ID: string;
  CONNECT_BUTTON_NAME: string;
  SIMPLE_CONNECT: boolean;
  EXTENSION_START_PATH: string;
}

export interface WalletConfig {
  SECRET_PHRASE: string;
  PASSWORD: string;
  COMMON: CommonWalletConfig;
  EXTENSION_PATH?: string;
}

export interface NetworkConfig {
  chainName: string;
  rpcUrl: string;
  chainId: number;
  tokenSymbol: string;
  scan?: string;
}
