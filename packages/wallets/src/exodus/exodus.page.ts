import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page } from '@playwright/test';

export class ExodusPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to exodus', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/onboarding.html');
      await this.page.reload();
      await this.page.waitForTimeout(1000);
      await this.unlock();
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      const firstTime = (await this.page.locator('text=Next').count()) > 0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if (
        (await this.page
          .locator('input[placeholder="Enter password"]')
          .count()) > 0
      ) {
        await this.page.fill(
          'input[placeholder="Enter password"]',
          this.config.PASSWORD,
        );
        await this.page.click('text=Unlock');
      }
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('text=Skip');
      await this.page.click('text=I Have A Wallet');
      await this.page.fill('input[type="text"]', this.config.SECRET_PHRASE);
      await this.page.click(':nth-match(:text("Restore"), 2)');
      await this.page.fill('input[type=password]', this.config.PASSWORD);
      await this.page.click('text=Next');
      await this.page.fill('input[type=password]', this.config.PASSWORD);
      await this.page.click(
        'div[data-testid="exodusmovement.exodus:id/button-next"]',
      );
      await this.page.waitForSelector('text=Continue');
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.click(':nth-match(:text("Connect"), 3)');
      await page.close();
    });
  }

  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.click('text=Confirm');
    });
  }

  // eslint-disable-next-line
  async importKey(key: string) {}

  // eslint-disable-next-line
  async addNetwork(networkName: string, networkUrl: string, chainId: number, tokenSymbol: string) {}

  // eslint-disable-next-line
  async assertTxAmount(page: Page, expectedAmount: string) {}

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAddress: string) {}
}
