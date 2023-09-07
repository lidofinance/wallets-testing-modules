import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page } from '@playwright/test';

export class BitKeepPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to BitKeep', async () => {
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
      // added explicit route to /onboarding due to unexpected first time route from /home.html to /onboarding - page is close
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
        "input[placeholder='Minimum 6 characters']",
        this.config.PASSWORD,
      );
      await this.page.fill(
        "input[placeholder='Enter the password again']",
        this.config.PASSWORD,
      );
      await this.page.click("button:has-text('Next')");
      await this.page.fill(
        'textarea[id=outlined-multiline-static]',
        this.config.SECRET_PHRASE,
      );
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

  // eslint-disable-next-line
    async addNetwork(networkName: string, networkUrl: string, chainId: number, tokenSymbol: string) {}

  // eslint-disable-next-line
  async importKey(key: string) {}

  // eslint-disable-next-line
  async assertTxAmount(page: Page, expectedAmount: string) {}

  // eslint-disable-next-line
  async confirmTx(page: Page) {}

  // eslint-disable-next-line
  async approveTokenTx(page: Page) {}

  // eslint-disable-next-line
  async useDefaultToApprove(page: Page) {}

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAddress: string) {}
}
