import { Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';
import { HomePage, SetupPage } from './pages';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import { NetworkConfig, WalletConnectTypes } from '../wallets.constants';

export class SafeWcPage implements WalletPage<WalletConnectTypes.WC> {
  logger = new ConsoleLogger(SafeWcPage.name);
  page?: Page;
  setupPage: SetupPage;
  homePage: HomePage;
  safeAccountUrl?: string;

  constructor(public options: WalletPageOptions) {}

  async initLocators() {
    this.setupPage = new SetupPage(
      this.page,
      this.options.extensionPage,
      this.options.stand.chainId,
    );
    this.homePage = new HomePage(this.page);
  }

  async navigate() {
    this.page = await this.options.browserContext.newPage();
    await this.initLocators();
    if (this.safeAccountUrl) {
      await test.step('Open Safe account', async () => {
        await this.page.goto(this.safeAccountUrl);
      });
    } else {
      this.safeAccountUrl = await this.setupPage.firstTimeSetupWallet();
    }
  }

  async connectWallet(wcUrl: string) {
    await this.navigate();
    await this.homePage.connectWallet(wcUrl);
    await this.page.close();
  }

  async setupNetwork(networkConfig: NetworkConfig) {
    await this.options.extensionPage.setupNetwork(networkConfig);
  }

  async changeNetwork(networkName: string) {
    await this.options.extensionPage.changeNetwork(networkName);
  }

  assertTxAmount(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  confirmTx(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  cancelTx(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  approveTokenTx?(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getTokenBalance?(): Promise<number> {
    throw new Error('Method not implemented.');
  }

  assertReceiptAddress(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getWalletAddress?(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  // SafePage does not support these methods
  setup(): Promise<void> {
    throw new Error('Unsupported method forWC+Safe wallet');
  }

  importKey(): Promise<void> {
    throw new Error('Unsupported method for WC+Safe wallet');
  }

  openLastTxInEthplorer?(): Promise<Page> {
    throw new Error('Unsupported method for WC+Safe wallet');
  }

  confirmAddTokenToWallet?(): Promise<void> {
    throw new Error('Unsupported method for WC+Safe wallet');
  }

  addNetwork(): Promise<void> {
    throw new Error('Unsupported method for WC+Safe wallet');
  }
}
