import { WalletTypes } from '../wallets.constants';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import { test, Page } from '@playwright/test';
import { OnboardingPage } from './pages';
import { ConsoleLogger } from '@nestjs/common';

export class ExodusPage implements WalletPage<WalletTypes.EOA> {
  logger = new ConsoleLogger(ExodusPage.name);
  page: Page | undefined;
  onboardingPage: OnboardingPage;

  constructor(public options: WalletPageOptions) {}

  /** Init all page objects Classes included to wallet */
  async initLocators() {
    this.onboardingPage = new OnboardingPage(
      this.page,
      this.options.accountConfig,
    );
  }

  /** Navigate to home page of OXK Wallet extension:
   *  - open the wallet extension
   *  - unlock extension (if needed)
   */
  async navigate() {
    await test.step('Navigate to exodus', async () => {
      this.page = await this.options.browserContext.newPage();
      await this.initLocators();
      await this.page.goto(
        this.options.extensionUrl +
          this.options.walletConfig.EXTENSION_START_PATH,
      );
      await this.page.reload();
      await this.page.waitForTimeout(1000);
      await this.unlock();
    });
  }

  /** Checks the wallet is set correctly and starts the wallet setup as the first time (if needed) */
  async setup() {
    await test.step('Setup wallet', async () => {
      await this.navigate();
      await this.onboardingPage.firstTimeSetup();
    });
  }

  /** Unlock wallet*/
  async unlock() {
    await test.step('Unlock wallet', async () => {
      if (
        (await this.page
          .locator('input[placeholder="Enter password"]')
          .count()) > 0
      ) {
        await this.page.fill(
          'input[placeholder="Enter password"]',
          this.options.accountConfig.PASSWORD,
        );
        await this.page.click('text=Unlock');
      }
    });
  }

  /** Click `Connect` button on the transaction `page` */
  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      const connectWalletBtn = page.getByText('Connect').nth(2);
      // the connect button is disabled by default, and it will be enabled after hover with awaiting
      await connectWalletBtn.hover();
      await page.waitForTimeout(2000);
      await connectWalletBtn.click();
    });
  }

  /** Click `Confirm` button on the transaction `page` */
  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.getByText('Confirm').click();
    });
  }

  async setupNetwork() {
    this.logger.error('Method "setupNetwork()" not implemented.');
  }

  async changeNetwork() {
    this.logger.error('Method "changeNetwork()" not implemented.');
  }

  async signTx() {
    throw new Error('Method not implemented.');
  }

  async cancelTx() {
    throw new Error('Method not implemented.');
  }

  async importKey() {
    throw new Error('Method not implemented.');
  }

  async addNetwork() {
    throw new Error('Method not implemented.');
  }

  async assertTxAmount() {
    throw new Error('Method not implemented.');
  }

  async assertReceiptAddress() {
    throw new Error('Method not implemented.');
  }
}
