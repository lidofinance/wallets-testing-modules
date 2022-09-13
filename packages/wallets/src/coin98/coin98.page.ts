import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page } from '@playwright/test';

export class Coin98 implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to Coin98', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/popup.html');
      await this.page.reload();
      await this.page.waitForTimeout(1000);
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      const firstTime =
        (await this.page.locator('text=Create Wallet').count()) > 0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('text=Restore Wallet');
      await this.page.click('text=Ok');
      const inputs = this.page.locator('input[type=password]');
      await inputs.nth(0).fill(this.config.PASSWORD);
      await inputs.nth(1).fill(this.config.PASSWORD);
      await this.page.click('button:has-text("Setup Password")');
      await this.page.click('button:has-text("Ok")');
      await this.page.fill('[placeholder="Search chain"]', 'eth');
      await this.page.click('.box-logo');
      await this.page.fill('[placeholder="Wallet name"]', 'test');
      await this.page.fill(
        '.content-editable--password',
        this.config.SECRET_PHRASE,
      );
      await this.page.click('button:has-text("Restore")');
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('.icon-app_menu');
      await this.page.click('.icon-app_add_wallet');
      await this.page.fill('[placeholder="Search chain"]', 'eth');
      await this.page.click('.box-logo');
      await this.page.click('button:has-text("Restore")');
      await this.page.fill('[placeholder="Wallet name"]', 'ganache');
      await this.page.fill('.content-editable--password', key);
      await this.page.click('button[type=submit]');
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.click('button:has-text("Connect")');
    });
  }

  // eslint-disable-next-line
  async assertTxAmount(page: Page, expectedAmount: string) {}

  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.click('button:has-text("Confirm")');
    });
  }
}
