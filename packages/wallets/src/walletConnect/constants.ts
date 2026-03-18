import type { Chain } from 'viem';
import {
  mainnet,
  holesky,
  hoodi,
  sepolia,
  optimismSepolia,
  optimism,
  soneiumMinato,
  soneium,
  unichain,
  unichainSepolia,
  zksync,
  arbitrum,
  polygon,
  base,
  bsc,
  linea,
  mantle,
  scroll,
  mode,
  zircuit,
  lisk,
} from 'viem/chains';
import {
  CommonWalletConfig,
  NetworkConfig,
  WalletConnectTypes,
} from '../wallets.constants';

export const WC_SDK_COMMON_CONFIG: CommonWalletConfig = {
  WALLET_NAME: 'walletconnect',
  EXTENSION_WALLET_NAME: null,
  CONNECTED_WALLET_NAME: 'WalletConnect',
  CONNECT_BUTTON_NAME: 'WalletConnect',
  STORE_EXTENSION_ID: null,
  WALLET_TYPE: WalletConnectTypes.WC_SDK,
  LATEST_STABLE_DOWNLOAD_LINK: null,
  EXTENSION_START_PATH: null,
  WC_PROJECT_ID: process.env.WC_PROJECT_ID,
};

export const SUPPORTED_CHAINS: Record<number, Chain> = {
  1: mainnet as Chain,
  17000: holesky as Chain,
  560048: hoodi as Chain,
  11155111: sepolia as Chain,
  10: optimism as Chain,
  11155420: optimismSepolia as Chain,
  1868: soneium as Chain,
  1946: soneiumMinato as Chain,
  130: unichain as Chain,
  1301: unichainSepolia as Chain,
  324: zksync as Chain,
  42161: arbitrum as Chain,
  137: polygon as Chain,
  8453: base as Chain,
  56: bsc as Chain,
  59144: linea as Chain,
  5000: mantle as Chain,
  534352: scroll as Chain,
  34443: mode as Chain,
  48900: zircuit as Chain,
  1135: lisk as Chain,
};

export function buildChainFromNetwork(network: NetworkConfig): Chain {
  return {
    id: network.chainId,
    name: network.chainName,
    nativeCurrency: {
      name: network.tokenSymbol,
      symbol: network.tokenSymbol,
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [network.rpcUrl],
      },
      public: {
        http: [network.rpcUrl],
      },
    },
  } as const satisfies Chain;
}
