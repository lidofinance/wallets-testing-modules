import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page } from '@playwright/test';

export class MathWalletPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to MathWallet', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/popup/popup.html');
      await this.page.reload();
      await this.page.waitForTimeout(1000);
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      const firstTime = (await this.page.locator('text=Create').count()) > 0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      const inputs = this.page.locator('input[type=password]');
      await inputs.nth(0).fill(this.config.PASSWORD);
      await inputs.nth(1).fill(this.config.PASSWORD);
      await this.page.click('.create');
      await this.page.click('.select-net');
      await this.page.click('text=Ethereum');
      await this.page.click('.back');
      await this.page.click('.network-add');
      await this.page.click('text="Import Wallet"');
      await this.page.click('text="Import by mnemonic"');
      await this.page.fill('textarea', this.config.SECRET_PHRASE);
      await this.page.click('text="Next"');
      await this.page.fill('[placeholder="Wallet Name"]', 'test');
      await this.page.click('text="Confirm"');
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      await this.page.click('.network-add');
      await this.page.click('text="Import Wallet"');
      await this.page.click('text="Import by private key"');
      await this.page.fill('textarea', key);
      await this.page.click('text="Next"');
      await this.page.fill('[placeholder="Wallet Name"]', 'test1');
      await this.page.click('text="Confirm"');
    });
  }

  // eslint-disable-next-line
  async connectWallet(page: Page) {}

  // eslint-disable-next-line
  async assertTxAmount(page: Page, expectedAmount: string) {}

  // eslint-disable-next-line
  async confirmTx(page: Page) {}
}
