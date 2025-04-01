export interface CommonWalletConfig {
  WALLET_NAME: string; // Name of the wallet being tested
  EXTENSION_WALLET_NAME: string; // Wallet name for install extension
  CONNECTED_WALLET_NAME: string; // Displayed name of connected wallet
  CONNECT_BUTTON_NAME: string; // Button name in the wallet list
  RPC_URL_PATTERN: string;
  STORE_EXTENSION_ID: string;
  WALLET_TYPE: WalletType;
  LATEST_STABLE_DOWNLOAD_LINK?: string; // Link to stable wallet extension version for test (optional)
  EXTENSION_START_PATH: string; // Start path for wallet setup
}

export enum WalletTypes {
  EOA = 'EOA',
  WC = 'WC',
}

export type WalletType = WalletTypes.WC | WalletTypes.EOA;

export interface WalletConfig {
  SECRET_PHRASE: string;
  PASSWORD: string;
  COMMON: CommonWalletConfig;
  EXTENSION_PATH?: string;
  NETWORK_NAME?: string;
}

export interface NetworkConfig {
  chainId: number;
  chainName: string;
  tokenSymbol: string;
  rpcUrl: string;
  scan: string;
  isDefaultNetwork?: boolean; //set true if the network exist in web3 extension.To set true fill in chainId,chainName,tokenSymbol
}

type MainnetNetworks =
  | 'ETHEREUM'
  | 'OPTIMISM'
  | 'SONEIUM'
  | 'UNICHAIN'
  | 'ZKSYNC'
  | 'ARBITRUM'
  | 'POLYGON'
  | 'BASE'
  | 'BNB'
  | 'LINEA'
  | 'MANTLE'
  | 'SCROLL'
  | 'MODE'
  | 'ZIRCUIT'
  | 'LISK';

export type TestnetNetworks =
  | 'ETHEREUM_HOODI'
  | 'ETHEREUM_HOLESKY'
  | 'ETHEREUM_SEPOLIA'
  | 'OP_SEPOLIA'
  | 'SONEIUM_MINATO'
  | 'UNICHAIN_SEPOLIA';

export const NETWORKS_CONFIG: {
  Mainnet: Record<MainnetNetworks, NetworkConfig>;
  Testnet: Record<TestnetNetworks, NetworkConfig>;
} = {
  Mainnet: {
    ETHEREUM: {
      chainId: 1,
      chainName: 'Ethereum Mainnet',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://rpc.ankr.com/eth',
      scan: 'https://etherscan.io/',
    },
    OPTIMISM: {
      chainId: 10,
      chainName: 'OP Mainnet',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://mainnet.optimism.io',
      scan: '',
    },
    SONEIUM: {
      chainId: 1868,
      chainName: 'Soneium',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://rpc.soneium.org/',
      scan: 'https://soneium-minato.blockscout.com/',
    },
    UNICHAIN: {
      chainId: 130,
      chainName: 'Unichain',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://unichain-rpc.publicnode.com/',
      scan: 'https://uniscan.xyz/',
    },
    ZKSYNC: {
      chainId: 324,
      chainName: 'zkSync Era Mainnet',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    ARBITRUM: {
      chainId: 42161,
      chainName: 'Arbitrum One',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    POLYGON: {
      chainId: 137,
      chainName: 'Polygon Mainnet',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    BASE: {
      chainId: 8453,
      chainName: 'Base Mainnet',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    BNB: {
      chainId: 56,
      chainName: 'Binance Smart Chain',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    LINEA: {
      chainId: 59144,
      chainName: 'Linea',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    MANTLE: {
      chainId: 5000,
      chainName: 'Mantle Mainnet',
      tokenSymbol: 'MNT',
      rpcUrl: 'https://rpc-moon.mantle.xyz/v1/NTQ3ODk1ZDdiOWRmODIyM2FiM2Y5YTVh',
      scan: '',
    },
    SCROLL: {
      chainId: 534352,
      chainName: 'Scroll Mainnet',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://rpc.scroll.io',
      scan: '',
    },
    MODE: {
      chainId: 34443,
      chainName: 'Mode',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://mainnet.mode.network',
      scan: '',
    },
    ZIRCUIT: {
      chainId: 48900,
      chainName: 'Zircuit',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://zircuit1-mainnet.p2pify.com',
      scan: '',
    },
    LISK: {
      chainId: 1135,
      chainName: 'Lisk',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://rpc.api.lisk.com/',
      scan: '',
    },
  },
  Testnet: {
    ETHEREUM_HOODI: {
      chainId: 560048,
      chainName: 'Ethereum Hoodi',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://rpc.hoodi.ethpandaops.io/',
      scan: 'https://explorer.hoodi.ethpandaops.io/',
    },
    ETHEREUM_HOLESKY: {
      chainId: 17000,
      chainName: 'Ethereum Holesky',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://holesky.drpc.org',
      scan: 'https://holesky.etherscan.io/',
    },
    ETHEREUM_SEPOLIA: {
      chainId: 11155111,
      chainName: 'Ethereum Sepolia',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://sepolia.drpc.org',
      scan: 'https://sepolia.etherscan.io/',
    },
    OP_SEPOLIA: {
      chainId: 11155420,
      chainName: 'OP Sepolia',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://sepolia.optimism.io',
      scan: 'https://sepolia-optimism.etherscan.io/',
    },
    SONEIUM_MINATO: {
      chainId: 1946,
      chainName: 'Soneium Testnet Minato',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://rpc.minato.soneium.org/',
      scan: 'https://soneium-minato.blockscout.com/',
    },
    UNICHAIN_SEPOLIA: {
      chainId: 1301,
      chainName: 'Unichain Sepolia',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://unichain-sepolia-rpc.publicnode.com/',
      scan: 'https://unichain.sepolia.xyz/',
    },
  },
};
