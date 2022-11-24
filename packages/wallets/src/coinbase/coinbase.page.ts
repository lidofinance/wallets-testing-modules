import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page } from '@playwright/test';

export class CoinbasePage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to coinbase', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(this.extensionUrl + '/index.html');
      await this.page.reload();
      await this.page.waitForTimeout(1000);
      await this.closePopover();
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
      console.log(firstTime);
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.page.locator('id=Unlock with password').count()) > 0) {
        await this.page.fill('id=Unlock with password', this.config.PASSWORD);
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
      await this.page.click('text=I already have a wallet');
      await this.page.click('text=Enter recovery phrase');
      await this.page.fill('input[type=input]', this.config.SECRET_PHRASE);
      await this.page.click('button:has-text("Import wallet")');
      await this.page.fill(
        'input[placeholder="Enter password"]',
        this.config.PASSWORD,
      );
      await this.page.fill(
        'input[placeholder="Enter password again"]',
        this.config.PASSWORD,
      );
      await this.page.click('data-testid=terms-and-privacy-policy');

      await this.page.click('button:has-text("Submit")');
      //wait for complete of recover process(need to wait for wallet page to be opened after seed recover)
      await this.page.waitForSelector('data-testid=portfolio-header--switcher');
      await this.closePopover();
    });
  }

  async addNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
  ) {
    await test.step('Add network', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('text="Settings"');
      await this.page.click('text="Networks"');
      await this.page.click('text=Add a network');
      await this.page.click('button[data-testid="add-custom-network"]');
      await this.page.fill('input[name="chainName"]', networkName);
      await this.page.fill('input[name="rpcUrls[0]"]', networkUrl);
      await this.page.fill('input[name="chainId"]', String(chainId));
      await this.page.fill('input[name="nativeCurrency.symbol"]', tokenSymbol);
      await this.page.click('text=Save');
      await this.navigate();
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
      await page.click('text=Confirm');
    });
  }

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAddress: string) {}

  // eslint-disable-next-line
  async importKey(key: string) {}
}
