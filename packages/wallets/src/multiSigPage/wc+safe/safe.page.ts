import { BrowserContext, Page, test } from '@playwright/test';
import { Logger } from '@nestjs/common';
import { HomePage, SetupPage } from './pages';
import { WalletPage } from '../../wallets/wallet.page';
import { NetworkConfig, WalletConfig } from '../../wallets.constants';

export class SafePage implements WalletPage<'WC'> {
  page: Page | undefined;
  logger: Logger;
  setupPage: SetupPage;
  homePage: HomePage;
  setupUrl: string;
  safeAccountUrl?: string;
  config: WalletConfig;

  constructor(
    private browserContext: BrowserContext,
    public walletPage: WalletPage<'EOA'>,
    public chainId: 1 | 17000,
  ) {
    this.logger = new Logger('WC+Safe wallet');
  }

  async initLocators() {
    this.setupPage = new SetupPage(this.page, this.walletPage, this.chainId);
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

  addNetwork(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    networkConfig: NetworkConfig,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isClosePage?: boolean,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  assertReceiptAddress(page: Page, expectedAmount: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  assertTxAmount(page: Page, expectedAmount: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  confirmTx(page: Page, setAggressiveGas?: boolean): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  importKey(key: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setup(network?: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
