import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page } from '@playwright/test';

export class TahoPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to taho', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.page.reload();
      await this.page.waitForTimeout(1000);
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to /onboarding due to unexpected first time route from /home.html to /onboarding - page always closing
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/tab.html#/onboarding');
      if (!this.page) throw "Page isn't ready";
      const firstTime =
        (await this.page.locator('text=Use existing wallet').count()) > 0;
      await this.page.screenshot({ path: 'taho.png' });
      expect(firstTime).toBe(true);
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('text=Use existing wallet');
      await this.page.click('text=Import recovery phrase');
      await this.page.fill(
        '[type=password]:above(:text("Password"))',
        this.config.PASSWORD,
      );
      await this.page.fill(
        '[type=password]:near(:text("Repeat password"))',
        this.config.PASSWORD,
      );
      await this.page.click('text=Begin the hunt');
      await this.page.fill('id=recovery_phrase', this.config.SECRET_PHRASE);
      await this.page.click('button:has-text("Import account")');
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('.profile_button');
      await this.page.click('text=Add wallet');
      await this.page.click('text=Import recovery phrase');
      await this.page.fill('id=recovery_phrase', key);
      await this.page.click('button:has-text("Import account")');
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.click('button:has-text("Connect")');
      await page.close();
    });
  }

  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      expect(await page.textContent('.currency-display-component__text')).toBe(
        expectedAmount,
      );
    });
  }

  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.click('text=Sign');
    });
  }

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAddress: string) {}

  // eslint-disable-next-line
  async addNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
  ) {}
}
