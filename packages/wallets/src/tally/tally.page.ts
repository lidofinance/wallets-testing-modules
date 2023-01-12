import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page } from '@playwright/test';

export class TallyPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to tally', async () => {
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
        (await this.page.locator('text=Welcome to Tally Ho!').count()) > 0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('text=Continue');
      await this.page.click('text=Continue');
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
  async addNetwork(networkName: string, networkUrl: string, chainId: number, tokenSymbol: string) {}
}
