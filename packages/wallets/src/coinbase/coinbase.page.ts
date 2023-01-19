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
        await this.page.fill('id=Unlock with password', this.config.PASSWORD);
        await this.page.click('text=Unlock');
      }
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
      const [addNetworkPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 5000 }),
        await this.page.click('button[data-testid="add-custom-network"]'),
      ]);
      await addNetworkPage.fill('input[name="chainName"]', networkName);
      await addNetworkPage.fill('input[name="rpcUrls[0]"]', networkUrl);
      await addNetworkPage.fill('input[name="chainId"]', String(chainId));
      await addNetworkPage.fill(
        'input[name="nativeCurrency.symbol"]',
        tokenSymbol,
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

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAddress: string) {
    //TODO add external check for address in etherscan
  }

  // eslint-disable-next-line
  async importKey(key: string) {}
}
