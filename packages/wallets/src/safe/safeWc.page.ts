import { Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';
import { HomePage, SetupPage } from './pages';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import { NetworkConfig, WalletConnectTypes } from '../wallets.constants';

export class SafeWcPage implements WalletPage<WalletConnectTypes.WC> {
  logger = new ConsoleLogger(SafeWcPage.name);
  page: Page;
  setupPage: SetupPage;
  homePage: HomePage;
  safeAccountUrl: string;

  constructor(public options: WalletPageOptions) {}

  async initLocators() {
    this.page = await this.options.browserContext.newPage();

    this.setupPage = new SetupPage(
      this.page,
      this.options.extensionPage,
      this.options.standConfig.chainId,
    );
    this.homePage = new HomePage(this.page);
  }

  async setup() {
    await this.options.extensionPage.setup();
    await this.initLocators();
    this.safeAccountUrl = await this.setupPage.firstTimeSetupWallet();
  }

  async navigate() {
    await test.step('Open Safe account', async () => {
      await this.page.goto(this.safeAccountUrl);
    });
  }

  async connectWallet(wcUrl: string) {
    await this.initLocators();
    await this.navigate();
    await this.homePage.connectWallet(wcUrl);
    await this.page.close();
  }

  /** Setup network to the extension wallet */
  async setupNetwork(networkConfig: NetworkConfig) {
    await this.options.extensionPage.setupNetwork(networkConfig);
  }

  /** Change network in the extension wallet */
  async changeNetwork(networkName: string) {
    await this.options.extensionPage.changeNetwork(networkName);
  }

  /** Check the wallet address exists in the extension wallet */
  async isWalletAddressExist(address: string) {
    return await this.options.extensionPage.isWalletAddressExist(address);
  }

  /** Import key to the extension wallet */
  async importKey(secretKey: string) {
    await this.options.extensionPage.importKey(secretKey);
  }

  /** Change account in the extension wallet */
  async changeWalletAccountByAddress(address: string) {
    await this.options.extensionPage.changeWalletAccountByAddress(address);
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
