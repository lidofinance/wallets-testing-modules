import { WalletPage } from '../wallet.page';
import { test, Page } from '@playwright/test';
import { LoginPage, OnboardingPage, WalletOperations } from './pages';
import { WalletPageOptions } from '../wallet.page';
import { ConsoleLogger } from '@nestjs/common';
import { getNotificationPage } from '../../utils/helper';

export class CtrlPage implements WalletPage {
  logger = new ConsoleLogger(CtrlPage.name);
  page: Page | undefined;
  onboardingPage: OnboardingPage;
  loginPage: LoginPage;

  constructor(public options: WalletPageOptions) {}

  /** Init all page objects Classes included to wallet */
  async initLocators() {
    this.page = await this.options.browserContext.newPage();
    this.onboardingPage = new OnboardingPage(
      this.page,
      this.options.extensionUrl,
      this.options.accountConfig,
      this.options.walletConfig,
    );
    this.loginPage = new LoginPage(this.page, this.options.accountConfig);
  }

  /** Open the home page of the wallet extension */
  async goto() {
    await this.page.goto(
      this.options.extensionUrl +
        this.options.walletConfig.EXTENSION_START_PATH,
    );
  }

  /** Navigate to home page of OXK Wallet extension:
   *  - open the wallet extension
   *  - unlock extension (if needed)
   */
  async navigate() {
    await test.step('Navigate to Ctrl', async () => {
      await this.initLocators();
      await this.goto();
      await this.loginPage.unlock();
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      await this.initLocators();
      await this.onboardingPage.firstTimeSetup();
    });
  }

  /** Click `Connect` button */
  async connectWallet() {
    await test.step('Connect Ctrl wallet', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      const operationPage = new WalletOperations(page);
      await operationPage.connectBtn.waitFor({
        state: 'visible',
        timeout: 10000,
      });
      await operationPage.connectBtn.click();
      // need wait the page to be closed after the extension is connected
      await new Promise<void>((resolve) => {
        operationPage.page.on('close', () => {
          resolve();
        });
      });
    });
  }

  async setupNetwork() {
    this.logger.debug('Method "setupNetwork()" not implemented.');
  }

  async changeNetwork() {
    this.logger.debug('Method "changeNetwork()" not implemented.');
  }

  importKey(): Promise<void> {
    throw new Error('Method not implemented.');
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

  approveTokenTx(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  openLastTxInEthplorer(): Promise<Page> {
    throw new Error('Method not implemented.');
  }

  getTokenBalance(): Promise<number> {
    throw new Error('Method not implemented.');
  }

  confirmAddTokenToWallet(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  assertReceiptAddress(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getWalletAddress(): Promise<string> {
    throw new Error('Method not implemented.');
  }

  addNetwork(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  changeWalletAccountByName(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  changeWalletAccountByAddress(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  isWalletAddressExist(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
