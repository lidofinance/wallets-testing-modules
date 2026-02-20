export type WCApproveNamespaces = Record<
  string,
  {
    accounts: string[];
    methods: string[];
    events: string[];
  }
>;

export interface CommonWalletConfig {
  WALLET_NAME: string; // Name of the wallet being tested
  EXTENSION_WALLET_NAME: string; // Wallet name for install extension
  CONNECTED_WALLET_NAME: string; // Displayed name of connected wallet
  CONNECT_BUTTON_NAME: string; // Button name in the wallet list
  STORE_EXTENSION_ID: string;
  WALLET_TYPE: WalletConnectType;
  LATEST_STABLE_DOWNLOAD_LINK?: string; // Link to stable wallet extension version for test (optional)
  EXTENSION_START_PATH: string; // Start path for wallet setup
  // Only for WalletConnect wallets via API @walletconnect/sign-client
  WC_PROJECT_ID?: string; // WalletConnect Cloud project ID
}

export enum WalletConnectTypes {
  EOA = 'EOA',
  WC = 'WC',
  WC_SDK = 'WC_SDK',
  IFRAME = 'IFRAME',
}

export type WalletConnectType =
  | WalletConnectTypes.WC
  | WalletConnectTypes.WC_SDK
  | WalletConnectTypes.EOA
  | WalletConnectTypes.IFRAME;

export interface StandConfig {
  chainId: number;
  standUrl: string;
  rpcUrl?: string; // fork rpc or stable rpc
}

export interface AccountConfig {
  SECRET_PHRASE: string;
  PASSWORD: string;
}

export interface NetworkConfig {
  chainId: number;
  chainName: string;
  tokenSymbol: string;
  rpcUrl: string;
  scan: string;
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
  | 'LISK'
  | 'AVAX';

export type TestnetNetworks =
  | 'ETHEREUM_HOODI'
  | 'ETHEREUM_HOLESKY'
  | 'ETHEREUM_SEPOLIA'
  | 'OP_SEPOLIA'
  | 'SONEIUM_MINATO'
  | 'UNICHAIN_SEPOLIA';

export const NETWORKS_CONFIG: {
  mainnet: Record<MainnetNetworks, NetworkConfig>;
  testnet: Record<TestnetNetworks, NetworkConfig>;
} = {
  mainnet: {
    ETHEREUM: {
      chainId: 1,
      chainName: 'Ethereum',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://ethereum-rpc.publicnode.com',
      scan: 'https://etherscan.io/',
    },
    OPTIMISM: {
      chainId: 10,
      chainName: 'OP',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://mainnet.optimism.io',
      scan: '',
    },
    SONEIUM: {
      chainId: 1868,
      chainName: 'Soneium',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://rpc.soneium.org/',
      scan: 'https://soneium.blockscout.com/',
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
      chainName: 'zkSync Era',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    ARBITRUM: {
      chainId: 42161,
      chainName: 'Arbitrum',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    POLYGON: {
      chainId: 137,
      chainName: 'Polygon',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    BASE: {
      chainId: 8453,
      chainName: 'Base',
      tokenSymbol: 'ETH',
      rpcUrl: null,
      scan: '',
    },
    BNB: {
      chainId: 56,
      chainName: 'BNB Chain',
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
      rpcUrl: 'https://mainnet.zircuit.com',
      scan: '',
    },
    LISK: {
      chainId: 1135,
      chainName: 'Lisk',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://rpc.api.lisk.com/',
      scan: '',
    },
    AVAX: {
      chainId: 43114,
      chainName: 'Avalanche',
      tokenSymbol: 'AVAX',
      rpcUrl: null,
      scan: 'https://snowtrace.io/',
    },
  },
  testnet: {
    ETHEREUM_HOODI: {
      chainId: 560048,
      chainName: 'Ethereum Hoodi',
      tokenSymbol: 'ETH',
      rpcUrl: 'https://0xrpc.io/hoodi',
      scan: 'https://hoodi.etherscan.io/',
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
      chainName: 'Sepolia',
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
