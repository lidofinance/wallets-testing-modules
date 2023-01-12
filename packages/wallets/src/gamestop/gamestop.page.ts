import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page } from '@playwright/test';

export class GameStopPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to GameStop', async () => {
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
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      const firstTime =
        (await this.page.locator('button:has-text("Recover Wallet")').count()) >
        0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.page.locator('id=password').count()) > 0) {
        await this.page.fill('id=password', this.config.PASSWORD);
        await this.page.click('button:has-text("Unlock")');
      }
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('button:has-text("Recover Wallet")');
      await this.page.click('input[id="self-custody"]');
      await this.page.click('input[id="terms"]');
      await this.page.click('button:has-text("Recover My Wallet")');
      await this.page.fill('textarea', this.config.SECRET_PHRASE.trim());
      await this.page.click('button:has-text("Import Wallet")');
      await this.page.fill('input[id="password"]', this.config.PASSWORD);
      await this.page.fill('input[id="password_conf"]', this.config.PASSWORD);
      await this.page.click('button:has-text("Next")');
      await this.page.click('button:has-text("Next")');
      await this.page.click('button:has-text("View wallet")');
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.click('button:has-text("Next")');
      await page.click('button:has-text("Connect")');
      await page.close();
    });
  }

  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.click('button:has-text("Approve")');
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('text=Account 1');
      await this.page.click('Import Account');
      await this.page.fill('id=private_key', key);
      await this.page.click("text='Import Account'");
    });
  }

  // eslint-disable-next-line
  async assertTxAmount(page: Page, expectedAmount: string) {}

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAddress: string) {}

  // eslint-disable-next-line
  async addNetwork(networkName: string, networkUrl: string, chainId: number, tokenSymbol: string) {}
}
