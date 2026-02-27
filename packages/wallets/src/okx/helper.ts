import { BrowserContext } from '@playwright/test';

const incorrectNetworkNames = new Map<string, string>([
  ['OP', 'Optimism'],
  ['Mantle Mainnet', 'Mantle'],
  ['Scroll Mainnet', 'Scroll'],
  ['Mode', 'Mode Network'],
  ['Soneium Testnet Minato', 'Soneium Minato Testnet'],
  ['Avalanche Network C-Chain', 'Avalanche C'],
]);

const OkxIncludedNetwork = [
  'Ethereum',
  'Linea',
  'zkSync Era',
  'Polygon',
  'Base',
  'BNB Chain',
  'Mantle',
  'Scroll',
  'Mode Network',
  'Zircuit',
  'Soneium Minato Testnet',
  'Avalanche C',
];

/** Check network name and return correct name suited for OKX Wallet*/
export function getCorrectNetworkName(networkName: string) {
  for (const [incorrectName, correctName] of incorrectNetworkNames.entries()) {
    if (networkName === incorrectName) {
      return correctName;
    }
  }
  return networkName;
}

export async function closeUnnecessaryPages(browserContext: BrowserContext) {
  const pages = browserContext.pages().slice(1);
  for (const page of pages) {
    await page.close();
  }
}

/** Before AddNetwork() we check the network is included in wallet or not*/
export async function isNeedAddNetwork(network: string) {
  const networkName = getCorrectNetworkName(network);
  return !OkxIncludedNetwork.includes(networkName);
}
