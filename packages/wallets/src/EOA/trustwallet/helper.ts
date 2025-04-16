const incorrectNetworkNames = new Map<string, string>([
  ['Ethereum Mainnet', 'Ethereum'],
]);

/** Check network name and return correct name suited for Trust Wallet*/
export function getCorrectNetworkName(networkName: string) {
  for (const [incorrectName, correctName] of incorrectNetworkNames.entries()) {
    if (networkName === incorrectName) {
      return correctName;
    }
  }
  return networkName;
}
