import { WalletConfig } from '../../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page } from '@playwright/test';

export class BitgetPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to Bitget', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.page.reload();
      await this.page.waitForTimeout(1000);
      await this.unlock();
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to /welcome.html due to unexpected first time route from /home.html to /welcome.html - page is close
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/welcome.html');
      await this.page.waitForSelector('text=Welcome to Bitget Wallet');
      const firstTime =
        (await this.page
          .locator("button:has-text('Import a wallet')")
          .count()) > 0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.page.locator('id=password').count()) > 0) {
        await this.page.fill('id=password', this.config.PASSWORD);
        await this.page.click('text=Unlock');
      }
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click("button:has-text('Import a wallet')");
      await this.page.fill(
        "input:below(div > p:has-text('Enter password'))",
        this.config.PASSWORD,
      );
      await this.page.fill(
        "input:below(p:has-text('Confirm password'))",
        this.config.PASSWORD,
      );
      await this.page.click("button:has-text('Next')");
      const inputs = this.page.locator('.wordInput-contaniner-input');
      const seedWords = this.config.SECRET_PHRASE.split(' ');
      for (let i = 0; i < seedWords.length; i++) {
        await inputs.nth(i).fill(seedWords[i]);
      }
      await this.page.click("button:has-text('Confirm')");
      await this.page.waitForSelector('text=Wallet successfully imported');
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.waitForTimeout(1000);
      await page.click("button:has-text('Connect')");
      await page.close();
    });
  }

  async addNetwork() {
    throw new Error('Method not implemented.');
  }

  async importKey() {
    throw new Error('Method not implemented.');
  }

  async assertTxAmount() {
    throw new Error('Method not implemented.');
  }

  async confirmTx() {
    throw new Error('Method not implemented.');
  }

  async signTx() {
    throw new Error('Method not implemented.');
  }

  async approveTokenTx() {
    throw new Error('Method not implemented.');
  }

  async assertReceiptAddress() {
    throw new Error('Method not implemented.');
  }
}
