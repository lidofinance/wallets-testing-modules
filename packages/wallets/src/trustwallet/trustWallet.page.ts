import { NetworkConfig, WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page } from '@playwright/test';
import { OnboardingPage, SettingPage, HomePage } from './pages';
import { closeUnnecessaryPages } from '../okx/helper';

export class TrustWalletPage implements WalletPage {
  page: Page | undefined;
  onboardingPage: OnboardingPage;
  settingsPage: SettingPage;
  homePage: HomePage;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async initLocators() {
    this.onboardingPage = new OnboardingPage(this.page, this.config);
    this.settingsPage = new SettingPage(this.page);
    this.homePage = new HomePage(this.page);
  }

  async navigate() {
    await test.step('Navigate to Trust wallet', async () => {
      this.page = await this.browserContext.newPage();
      await this.initLocators();
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
      await this.page.goto(this.extensionUrl + '/home.html#/');
      await this.unlock();
      await new OnboardingPage(this.page, this.config).firstTimeSetup();
    });
    await closeUnnecessaryPages(this.browserContext);
  }

  async unlock() {
    await test.step('Unlock', async () => {
      const passwordInput = this.page.locator('input[type=password]');
      try {
        await passwordInput.waitFor({ state: 'visible', timeout: 2000 });
        await passwordInput.fill(this.config.PASSWORD);
        await this.page.locator('button:has-text("Unlock")').click();
      } catch {
        console.log('Wallet unlocking is not needed');
      }
    });
  }

  /** Add new network in the wallet*/
  async addNetwork(networkConfig: NetworkConfig) {
    await test.step(`Add ${networkConfig.chainName} network`, async () => {
      await this.navigate();
      await this.settingsPage.openSetting();
      await this.settingsPage.addNetwork(networkConfig);
      await this.navigate();
    });
  }

  async setupNetwork(networkConfig: NetworkConfig) {
    await test.step(`Setup "${networkConfig.chainName}" Network`, async () => {
      await this.navigate();
      if (await this.homePage.isNetworkExists(networkConfig.chainName)) {
        await this.homePage.changeNetwork(networkConfig.chainName);
      } else {
        await this.addNetwork(networkConfig);
      }
    });
  }

  /** Change network in the wallet */
  async changeNetwork(networkName: string) {
    await this.navigate();
    await this.homePage.changeNetwork(networkName);
    await this.page.close();
  }

  async importTokens(token: string) {
    await test.step('Import token', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      await this.page.click('id="manage-tokens-button"');
      await this.page.fill(
        'input[placeholder="Token name or contract address"]',
        token,
      );
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

  // eslint-disable-next-line
  async signTx(page: Page) {}

  // eslint-disable-next-line
  async assertReceiptAddress(page: Page, expectedAddress: string) {}

  // eslint-disable-next-line
  async importKey(key: string) {}
}
