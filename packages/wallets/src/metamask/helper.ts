const MMPopularNetworks = [
  'Ethereum Mainnet',
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
