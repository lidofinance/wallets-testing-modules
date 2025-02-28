import { BrowserContext, Page, test } from '@playwright/test';
import { WalletConnectPage } from '../walletConnect.page';
import { Logger } from '@nestjs/common';
import { HomePage, SetupPage } from './pages';
import { WalletPage } from '../../EOA/wallet.page';

export class SafePage implements WalletConnectPage {
  page: Page | undefined;
  logger: Logger;
  setupPage: SetupPage;
  homePage: HomePage;
  setupUrl: string;
  safeAccountUrl?: string;

  constructor(
    private browserContext: BrowserContext,
    public metamaskPage: WalletPage,
    public chainId: 1 | 17000,
  ) {
    this.logger = new Logger('WC+Safe wallet');
  }

  async initLocators() {
    this.setupPage = new SetupPage(this.page, this.metamaskPage, this.chainId);
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
}
