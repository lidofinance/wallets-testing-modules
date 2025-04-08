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

export async function isPopularNetwork(networkName: string) {
  return MMPopularNetworks.includes(networkName);
}
