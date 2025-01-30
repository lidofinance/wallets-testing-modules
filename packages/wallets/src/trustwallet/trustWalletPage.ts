import { NetworkConfig, WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page } from '@playwright/test';

export class TrustWalletPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to Trust wallet', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.page.waitForTimeout(1000);
      await this.unlock();
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to /onboarding due to unexpected first time route from /home.html to /onboarding - page is close
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/home.html#/onboarding');
      await this.page.waitForSelector(
        'div:has-text("Welcome to the Trust Wallet Extension")',
      );
      if (!this.page) throw "Page isn't ready";
      const firstTime =
        (await this.page.locator('text=Import or recover wallet').count()) > 0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.page.locator('input[type=password]').count()) > 0) {
        await this.page.fill('input[type=password]', this.config.PASSWORD);
        await this.page.click('button:has-text("Unlock")');
      }
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('text="Import or recover wallet"');
      await this.page
        .locator(
          'xpath=//p[contains(text(), "New password")]//following-sibling::div//input',
        )
        .fill(this.config.PASSWORD);
      await this.page
        .locator(
          'xpath=//p[contains(text(), "Confirm new password")]//following-sibling::div//input',
        )
        .fill(this.config.PASSWORD);
      await this.page.click('input[type=checkbox]');
      await this.page.click('button:has-text("Next")');
      await this.page.waitForTimeout(2000);
      const inputs = this.page.locator('input[type="password"]');
      const seedWords = this.config.SECRET_PHRASE.split(' ');
      for (let i = 0; i < seedWords.length; i++) {
        await inputs.nth(i).fill(seedWords[i]);
      }
      await this.page.click('button:has-text("Next")');
      await this.page.click('button:has-text("No thanks")');
      await this.page.waitForSelector(
        'text=You have successfully imported your wallet!',
      );
    });
  }

  async addNetwork(networkConfig: NetworkConfig) {
    await test.step('Add network', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('text=Settings');
      await this.page.click('text=Network');
      await this.page.click('text=Add a network');
      await this.page.click('button:has-text("Add custom network")');
      await this.page.fill(
        'input[placeholder="Network name"]',
        networkConfig.chainName,
      );
      await this.page.fill(
        'input[placeholder="RPC URL"]',
        networkConfig.rpcUrl,
      );
      await this.page.fill(
        'input[placeholder="Chain ID"]',
        String(networkConfig.chainId),
      );
      await this.page.fill(
        'input[placeholder="Token symbol"]',
        networkConfig.tokenSymbol,
      );
      await this.page.click('button:has-text("Add custom network")');
      await this.navigate();
    });
  }

  async importTokens(token: string) {
    await test.step('Import token', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      await this.page.click('id="manage-tokens-button"');
      await this.page
        .locator('input[placeholder="Token name or contract address"]')
        .fill(token);
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Connect")');
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
      await page.click('text=Confirm');
    });
  }

  async signTx() {
    throw new Error('Method not implemented.');
  }

  async assertReceiptAddress() {
    throw new Error('Method not implemented.');
  }

  async importKey() {
    throw new Error('Method not implemented.');
  }
}
