import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page } from '@playwright/test';
import { WalletConfig } from '../wallets.constants';
import { LoginPage, OnboardingPage, WalletOperations } from './pages';

export class CtrlPage implements WalletPage {
  page: Page | undefined;
  onboardingPage: OnboardingPage;
  loginPage: LoginPage;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  /** Init all page objects Classes included to wallet */
  async initLocators() {
    this.page = await this.browserContext.newPage();
    this.onboardingPage = new OnboardingPage(
      this.page,
      this.extensionUrl,
      this.config,
    );
    this.loginPage = new LoginPage(this.page, this.config);
  }

  /** Open the home page of the wallet extension */
  async goto() {
    await this.page.goto(
      this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
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
  async connectWallet(page: Page) {
    await test.step('Connect Ctrl wallet', async () => {
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

  setupNetwork(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  addNetwork(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  changeNetwork(): Promise<void> {
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
