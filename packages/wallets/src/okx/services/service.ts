import { BrowserContext } from '@playwright/test';

export async function checkNetworkName(networkName: string) {
  switch (networkName) {
    case 'Linea Mainnet':
      return 'Linea';
    case 'zkSync Era Mainnet':
      return 'zkSync Era';
    case 'OP Mainnet':
      return 'Optimism';
    case 'Polygon Mainnet':
      return 'Polygon';
    case 'Base Mainnet':
      return 'Base';
    case 'Binance Smart Chain':
      return 'BNB Chain';
    case 'Mantle Mainnet':
      return 'Mantle';
    case 'Scroll Mainnet':
      return 'Scroll';
    case 'Mode':
      return 'Mode Network';
    default:
      return networkName;
  }
}

export async function closeUnnecessaryPages(browserContext: BrowserContext) {
  const pages = browserContext.pages().slice(1);
  for (const page of pages) {
    await page.close();
  }
}

/** Before AddNetwork() we check the network is included in wallet or not*/
export async function isNeedAddNetwork(network: string) {
  const networkName = await checkNetworkName(network);
  const OkxIncludedNetwork = [
    'Linea',
    'zkSync Era',
    'Polygon',
    'Base',
    'BNB Chain',
    'Mantle',
    'Scroll',
    'Mode Network',
    'Zircuit',
  ];
  return !OkxIncludedNetwork.includes(networkName);
}
