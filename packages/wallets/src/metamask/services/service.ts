const MMPopularNetworks = [
  'zkSync Era Mainnet',
  'OP Mainnet',
  'Arbitrum One',
  'Polygon Mainnet',
  'Base Mainnet',
  'Binance Smart Chain',
  'Linea',
];

export async function isNetworkPopular(networkName: string) {
  return MMPopularNetworks.includes(networkName);
}
