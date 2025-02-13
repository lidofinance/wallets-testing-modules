import { NetworkConfig, WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page, expect } from '@playwright/test';
import {
  OnboardingPage,
  SettingPage,
  HomePage,
  WalletOperations,
  LoginPage,
} from './pages';
import { closeUnnecessaryPages } from '../okx/helper';

export class TrustWalletPage implements WalletPage {
  page: Page | undefined;
  onboardingPage: OnboardingPage;
  settingsPage: SettingPage;
  homePage: HomePage;
  loginPage: LoginPage;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async initLocators() {
    this.onboardingPage = new OnboardingPage(this.page, this.config);
    this.settingsPage = new SettingPage(this.page);
    this.homePage = new HomePage(this.page);
    this.loginPage = new LoginPage(this.page, this.config);
  }

  /** Navigate to home page of Trust Wallet extension */
  async navigate() {
    await test.step('Navigate to Trust wallet', async () => {
      this.page = await this.browserContext.newPage();
      await this.initLocators();
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.page.waitForTimeout(1000);
      await this.loginPage.unlock();
    });
  }

  /** Checks the wallet is set correctly and starts the wallet setup as the first time (if needed) */
  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to /onboarding due to unexpected first time route from /home.html to /onboarding - page is close
      this.page = await this.browserContext.newPage();
      await this.initLocators();
      await this.page.goto(this.extensionUrl + '/home.html#/onboarding');
      await this.loginPage.unlock();
      await this.onboardingPage.firstTimeSetup();
    });
    await closeUnnecessaryPages(this.browserContext);
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

  /** Checks the is installed the needed network and add new network to wallet (if needed) */
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

  /** Click `Connect` button on the transaction `page` */
  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      const txPage = new WalletOperations(page);
      await expect(txPage.connectBtn).toBeEnabled();
      await txPage.connectBtn.click();
    });
  }

  /** Get the `amount` from transaction and comply with the `expectedAmount` */
  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      const txPage = new WalletOperations(page);
      expect(parseFloat(await txPage.txAmountValue.textContent())).toBe(
        expectedAmount,
      );
    });
  }

  /** Confirm transaction */
  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      const txPage = new WalletOperations(page);
      await expect(txPage.confirmBtn).toBeEnabled();
      await txPage.confirmBtn.click();
    });
  }

  /** Reject transaction */
  async cancelTx(page: Page) {
    await test.step('Cancel TX', async () => {
      const txPage = new WalletOperations(page);
      await expect(txPage.rejectBtn).toBeEnabled();
      await txPage.rejectBtn.click();
    });
  }

  /** Get the `address` from transaction and comply with the `expectedAddress` */
  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
      await new WalletOperations(page).viewDetailsBtn.click();
      await page.getByText(expectedAddress).isVisible();
    });
  }

  async importKey() {
    throw new Error('Method not implemented.');
  }
}
