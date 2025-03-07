import { BrowserContext, Page, test } from '@playwright/test';
import { HomePage, SetupPage } from './pages';
import { WalletPage } from '../../wallet.page';
import { WalletTypes } from '../../wallets.constants';

export class SafePage implements WalletPage<WalletTypes.WC> {
  type = WalletTypes.WC;
  page: Page | undefined;
  setupPage: SetupPage;
  homePage: HomePage;
  safeAccountUrl?: string;

  constructor(
    private browserContext: BrowserContext,
    public extensionPage: WalletPage<WalletTypes.EOA>,
    public chainId: 1 | 17000,
  ) {}

  async initLocators() {
    this.setupPage = new SetupPage(this.page, this.extensionPage, this.chainId);
    this.homePage = new HomePage(this.page);
  }

  async navigate() {
    this.page = await this.browserContext.newPage();
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
    throw new Error('Unsupported method for WalletTypes.WC');
  }

  importKey(): Promise<void> {
    throw new Error('Unsupported method for WalletTypes.WC');
  }

  openLastTxInEthplorer?(): Promise<Page> {
    throw new Error('Unsupported method for WalletTypes.WC');
  }

  confirmAddTokenToWallet?(): Promise<void> {
    throw new Error('Unsupported method for WalletTypes.WC');
  }

  addNetwork(): Promise<void> {
    throw new Error('Unsupported method for WalletTypes.WC');
  }

  changeNetwork?(): Promise<void> {
    throw new Error('Unsupported method for WalletTypes.WC');
  }
}
