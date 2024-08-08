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
      this.page = this.browserContext.pages()[0];
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.page.reload();
      await this.closePopover(this.page);
    });
  }

  async setup(network: string) {
    await test.step('Setup', async () => {
      await this.navigate();
      this.page = this.browserContext.pages()[0];
      const firstTime = await this.page.waitForSelector('text=Get Started');
      if (firstTime) await this.firstTimeSetup(network);
    });
  }

  async firstTimeSetup(network: string) {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('text=Get Started');
      await this.page.click('text=Ok');
      await this.page.waitForSelector('input[type=password]');
      const inputs = await this.page.locator('input[type=password]');
      await inputs.nth(0).fill(this.config.PASSWORD);
      await inputs.nth(1).fill(this.config.PASSWORD);
      await this.page.click('button:has-text("Setup Password")');
      await this.page.click('button:has-text("Ok")');
      await this.page.click('button:has-text("Continue")');
      await this.page.fill('[placeholder="Search"]', network);
      await this.page.getByText(network, { exact: true }).click();
      await this.page.click('button:has-text("Restore")');
      await this.page.fill('input[name="name"]', 'test');
      await this.page.fill(
        'div[class="relative w-full"] >> div',
        this.config.SECRET_PHRASE.trim(),
      );
      await this.page.locator('button:has-text("Restore")').click();
      await this.page.waitForSelector('text=Success!');
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
      await this.unlock(page);
      const selectAllBtn = page.getByText('Select all', { exact: true });
      // for polygon network there is no account selection preview
      if (await selectAllBtn.isVisible()) {
        await selectAllBtn.click();
      }
      await page.click('button:has-text("Confirm")');
      await page.click('button:has-text("Connect")');
    });
  }
  async closePopover(popUpPage: Page) {
    //popUpPage param required since noisy pop-up can appear in confirmation pages
    try {
      const popoverContent = popUpPage.locator('button:has-text("Try now")');
      await popoverContent.waitFor({ state: 'visible', timeout: 2000 });
      await popoverContent.click();
    } catch (error) {
      return;
    }
  }

  async unlock(page: Page) {
    await test.step('Unlock', async () => {
      await page.waitForSelector('input[name="password"]');
      if ((await page.locator('input[name="password"]').count()) > 0) {
        await page.fill('input[name=password]', this.config.PASSWORD);
        await page.click('text=Unlock Wallet');
        await this.closePopover(page);
      }
    });
  }

  // eslint-disable-next-line
  async assertTxAmount(page: Page, expectedAmount: string) {}

  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.click('button:has-text("Confirm")');
    });
  }

  // eslint-disable-next-line
  async signTx(page: Page) {}

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAmount: string) {}

  // eslint-disable-next-line
  async addNetwork(networkName: string, networkUrl: string, chainId: number, tokenSymbol: string) {}
}
