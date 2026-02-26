import { Account } from 'viem';

export class Accounts {
  private activeAccount: Account;
  private accountsStore: Map<string, Account> = new Map();

  async isWalletAddressExist(address: string): Promise<boolean> {
    return this.accountsStore.has(address.toLowerCase());
  }

  setActiveAccount(account: Account) {
    if (!this.accountsStore.has(account.address.toLowerCase())) {
      console.warn(
        `Account ${account.address} not found in accounts list while setting active account, adding it to accounts list`,
      );
      this.storeAccount(account);
    }
    this.activeAccount = account;
  }

  getActiveAccount() {
    if (!this.activeAccount) {
      throw new Error('Active account is not set');
    }
    return this.activeAccount;
  }

  getEip115Account(chainId: number, address: string): string {
    return `eip155:${chainId}:${address}`;
  }

  storeAccount(account: Account) {
    if (!this.accountsStore.has(account.address)) {
      this.accountsStore.set(account.address, account);
    }
  }

  getAccountByAddress(address: string) {
    const account = this.accountsStore.get(address.toLowerCase());

    if (!account) throw new Error(`Account with address ${address} not found`);
    return account;
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
