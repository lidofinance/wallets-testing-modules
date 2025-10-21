const MMPopularNetworks = [
  'zkSync Era Mainnet',
  'OP Mainnet',
  'Arbitrum One',
  'Polygon Mainnet',
  'Base Mainnet',
  'Binance Smart Chain',
  'Linea',
  'Avalanche Network C-Chain',
];

const MMPopularTestnetNetworks = ['Sepolia', 'Linea Sepolia'];

export async function isPopularMainnetNetwork(networkName: string) {
  return MMPopularNetworks.includes(networkName);
}

export async function isPopularTestnetNetwork(networkName: string) {
  return MMPopularTestnetNetworks.includes(networkName);
}

const incorrectNetworkNames = new Map<string, string>([
  ['Ethereum', 'Ethereum Mainnet'],
  ['zkSync Era', 'zkSync Era Mainnet'],
  ['OP', 'OP Mainnet'],
  ['Polygon', 'Polygon Mainnet'],
  ['Base', 'Base Mainnet'],
  ['BNB Chain', 'Binance Smart Chain'],
  ['Arbitrum', 'Arbitrum One'],
  ['Avalanche', 'Avalanche Network C-Chain'],
]);

/** Check network name and return correct name suited for MM wallet*/
export function getCorrectNetworkName(networkName: string) {
  for (const [incorrectName, correctName] of incorrectNetworkNames.entries()) {
    if (networkName === incorrectName) {
      return correctName;
    }
  }
  return networkName;
}
