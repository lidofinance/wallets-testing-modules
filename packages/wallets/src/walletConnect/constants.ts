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
} from 'viem/chains';

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
};
