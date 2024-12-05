export async function isNetworkPopular(networkName: string) {
  const MMPopularNetworks = [
    'zkSync Era Mainnet',
    'OP Mainnet',
    'Arbitrum One',
    'Polygon Mainnet',
    'Base Mainnet',
    'Binance Smart Chain',
    'Linea',
  ];

  return MMPopularNetworks.includes(networkName);
}