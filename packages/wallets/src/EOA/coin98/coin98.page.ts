import { WalletConfig, WalletTypes } from '../../wallets.constants';
import { WalletPage } from '../../wallet.page';
import { test, BrowserContext, Page } from '@playwright/test';

export class Coin98 implements WalletPage<WalletTypes.EOA> {
  type = WalletTypes.EOA;
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to Coin98', async () => {
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.page.reload();
      await this.closePopover(this.page);
    });
  }

  async setup(network: string) {
    await test.step('Setup', async () => {
      await this.waitForAutomaticallyOpenedWalletPageAfterInstallation();
      await this.navigate();
      const firstTime = await this.page.waitForSelector('text=Choose language');
      if (firstTime) await this.firstTimeSetup(network);
    });
  }

  async firstTimeSetup(network: string) {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('button:has-text("Continue")');
      await this.page.click('button:has-text("Confirm")');
      await this.page.waitForSelector('input[type=password]');
      await this.page.waitForTimeout(1000);
      const inputs = this.page.locator('input[type=password]');
      for (const char of this.config.PASSWORD) {
        await inputs.nth(0).press(char);
        // need some input timeout since first input has validation - requires Digit,letters,special symbols.
        // If input full value validation is lagy - doesn't mark as filled required specs.
        await this.page.waitForTimeout(40);
      }
      await inputs.nth(1).fill(this.config.PASSWORD);
      // Coin98 UI bug there is 2 div with pws/confirm btn and etc - that's why [first] && [exact true]
      await this.page
        .locator('button:has-text("Confirm")')
        .first()
        .click({ force: true });
      await this.page.click('//div[contains(@class, "frame-check-box")]');
      await this.page
        .locator('button:has-text("Continue")')
        .first()
        .click({ force: true });
      await this.page.fill('input[placeholder="Search blockchain"]', network);
      await this.page.getByText(network, { exact: true }).click();
      await this.page.click('button:has-text("Restore")');
      await this.page.fill('input[name="name"]', 'test');
      await this.page.fill(
        'div[class="relative w-full"] >> div',
        this.config.SECRET_PHRASE.trim(),
      );
      await this.page
        .locator('button:has-text("Restore")')
        .first()
        .click({ force: true });
      await this.page.waitForSelector('text=Restore Wallet Successfully');
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
      if (await page.locator('button:has-text("Confirm")').isVisible()) {
        await page.click('button:has-text("Confirm")');
      }
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

  async assertTxAmount() {
    throw new Error('Method not implemented.');
  }

  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.click('button:has-text("Confirm")');
    });
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

  async addNetwork() {
    throw new Error('Method not implemented.');
  }

  // We need this function cause Coin98 wallet open the extension page after installation
  // and close other opened wallet pages (include page with we work so here was the test crash)
  // We wait for that action and after that we continue testing
  async waitForAutomaticallyOpenedWalletPageAfterInstallation() {
    if (this.browserContext.pages().length === 1) {
      await this.browserContext.waitForEvent('page');
    }
    this.page = this.browserContext.pages()[1];
  }
}
