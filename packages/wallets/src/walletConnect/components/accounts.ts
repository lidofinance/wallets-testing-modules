export class Accounts {
  constructor(private accounts: string[]) {}

  async isWalletAddressExist(address: string): Promise<boolean> {
    return this.accounts.includes(address);
  }

  changeWalletAccountByName?(accountName: string): Promise<void> {
    console.log(accountName);
    throw new Error('Method not implemented.');
  }
  changeWalletAccountByAddress?(address: string): Promise<void> {
    console.log(address);
    throw new Error('Method not implemented.');
  }
}
