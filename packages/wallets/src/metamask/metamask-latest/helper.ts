const MMPopularNetworks = [
  'zkSync Era',
  'OP',
  'Arbitrum',
  'Polygon',
  'Base',
  'BNB Chain',
  'Linea',
  'Avalanche',
];

const MMPopularTestnetNetworks = ['Sepolia', 'Linea Sepolia'];

export async function isPopularMainnetNetwork(networkName: string) {
  return MMPopularNetworks.includes(networkName);
}

export async function isPopularTestnetNetwork(networkName: string) {
  return MMPopularTestnetNetworks.includes(networkName);
}

const incorrectNetworkNames = new Map<string, string>([
  ['Ethereum Mainnet', 'Ethereum'],
  ['zkSync Era Mainnet', 'zkSync Era'],
  ['OP Mainnet', 'OP'],
  ['Polygon Mainnet', 'Polygon'],
  ['Base Mainnet', 'Base'],
  ['Binance Smart Chain', 'BNB Chain'],
  ['Arbitrum One', 'Arbitrum'],
  ['Avalanche Network C-Chain', 'Avalanche'],
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
