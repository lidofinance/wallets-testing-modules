import { NetworkConfig, WalletConnectTypes } from '../wallets.constants';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import expect from 'expect';
import { test, Page } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';

export class CoinbasePage implements WalletPage<WalletConnectTypes.EOA> {
  logger = new ConsoleLogger(CoinbasePage.name);
  page: Page | undefined;

  constructor(public options: WalletPageOptions) {}

  async navigate() {
    await test.step('Navigate to coinbase', async () => {
      this.page = await this.options.browserContext.newPage();
      await this.page.goto(
        this.options.extensionUrl +
          this.options.walletConfig.EXTENSION_START_PATH,
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
        (await this.page
          .locator('button:has-text("Create new wallet")')
          .count()) > 0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.page.locator('id=Unlock with password').count()) > 0) {
        await this.page.fill(
          'id=Unlock with password',
          this.options.accountConfig.PASSWORD,
        );
        await this.page.click('text=Unlock');
      }
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('text=I already have a wallet');
      await this.page.click('text=Enter recovery phrase');
      try {
        await this.page
          .locator('text=Acknowledge')
          .waitFor({ state: 'visible', timeout: 2000 });
        await this.page.click('text=Acknowledge');
      } catch (error) {
        this.logger.warn('The popup did not appear, skipping the click.');
      }
      await this.page.fill(
        'input[type=input]',
        this.options.accountConfig.SECRET_PHRASE,
      );
      await this.page.click('button:has-text("Import wallet")');
      await this.page.fill(
        'input[placeholder="Enter password"]',
        this.options.accountConfig.PASSWORD,
      );
      await this.page.fill(
        'input[placeholder="Enter password again"]',
        this.options.accountConfig.PASSWORD,
      );
      await this.page.click('data-testid=terms-and-privacy-policy');

      await this.page.click('button:has-text("Submit")');
      await this.page.waitForSelector('data-testid=portfolio-header--switcher');
    });
  }

  async addNetwork(networkConfig: NetworkConfig) {
    await test.step('Add network', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('text="Settings"');
      await this.page.click('text="Networks"');
      const [addNetworkPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 5000 }),
        await this.page.click('button[data-testid="add-custom-network"]'),
      ]);
      await addNetworkPage.fill(
        'input[name="chainName"]',
        networkConfig.chainName,
      );
      await addNetworkPage.fill(
        'input[name="rpcUrls[0]"]',
        networkConfig.rpcUrl,
      );
      await addNetworkPage.fill(
        'input[name="chainId"]',
        String(networkConfig.chainId),
      );
      await addNetworkPage.fill(
        'input[name="nativeCurrency.symbol"]',
        networkConfig.tokenSymbol,
      );
      await addNetworkPage.click('text=Save');
    });
  }

  //Check me if it persists
  async closeTransactionPopover() {
    await test.step('Close popover if exists', async () => {
      if (!this.page) throw "Page isn't ready";
      const popover = (await this.page.locator('text="Got it"').count()) > 0;
      if (popover) await this.page.click('text="Got it"');
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
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
      await this.closeTransactionPopover();
      await page.click('button[data-testid="request-confirm-button"]');
    });
  }

  async setupNetwork() {
    this.logger.debug('Method "setupNetwork()" not implemented.');
  }

  async changeNetwork() {
    this.logger.debug('Method "changeNetwork()" not implemented.');
  }

  async cancelTx() {
    throw new Error('Method not implemented.');
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
