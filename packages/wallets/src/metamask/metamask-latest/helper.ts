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
