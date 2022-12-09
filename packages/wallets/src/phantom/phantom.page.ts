import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page } from '@playwright/test';

export class PhantomPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to phantom', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/popup.html');
      await this.page.reload();
      await this.page.waitForTimeout(1000);
      await this.closePopover();
      await this.unlock();
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to /onboarding due to unexpected first time route from /popup.html to /onboarding - page is close
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/onboarding.html');
      if (!this.page) throw "Page isn't ready";
      const firstTime =
        (await this.page
          .locator('button:has-text("I already have a wallet")')
          .count()) > 0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.page.locator('id=password').count()) > 0) {
        await this.page.fill('input[name=password]', this.config.PASSWORD);
        await this.page.click('text=Unlock');
      }
    });
  }

  async closePopover() {
    await test.step('Close popover if exists', async () => {
      if (!this.page) throw "Page isn't ready";
      const popover =
        (await this.page.locator('data-testid=popover-close').count()) > 0;
      if (popover) await this.page.click('data-testid=popover-close');
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('button:has-text("I already have a wallet")');
      const inputs = this.page.locator('input[data-testid]');
      const seedWords = this.config.SECRET_PHRASE.split(' ');
      for (let i = 0; i < seedWords.length; i++) {
        await inputs.nth(i).fill(seedWords[i]);
      }
      await this.page.click('button[type=submit]');
      await this.page.click('button:has-text("Import Selected Accounts")');
      await this.page.fill('input[name=password]', this.config.PASSWORD);
      await this.page.fill('input[name=confirmPassword]', this.config.PASSWORD);
      await this.page.click('input[type=checkbox]');
      await this.page.click('button:has-text("Continue")');
      await this.page.click('button:has-text("Continue")');
      await this.closePopover();
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('text=W1');
      await this.page.click('div:has-text("Wallet 1")');
      await this.page.click('button:has-text("Add / Connect Wallet")');
      await this.page.click(
        'div[data-testid="add-account-create-new-wallet-button"]',
      );
      await this.page.fill('textarea', key);
      await this.page.click('button:has-text("Import")');
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.click('button:has-text("Connect")');
    });
  }

  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      expect(
        await page.locator(`text=Send ${expectedAmount} SOL`).count(),
      ).toBe(1);
    });
  }

  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.click('text=Approve');
    });
  }

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAddress: string) {
  }

  // eslint-disable-next-line
  async addNetwork(networkName: string, networkUrl: string, chainId: number, tokenSymbol: string) {}
}
