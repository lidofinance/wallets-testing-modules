import { NetworkConfig, WalletConfig } from '../../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, BrowserContext, Page, expect } from '@playwright/test';
import { Logger } from '@nestjs/common';
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
  walletOperations: WalletOperations;
  logger = new Logger('Trust Wallet');

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async initLocators() {
    this.onboardingPage = new OnboardingPage(this.page, this.config);
    this.settingsPage = new SettingPage(this.page);
    this.homePage = new HomePage(this.page);
    this.loginPage = new LoginPage(this.page, this.config, this.logger);
    this.walletOperations = new WalletOperations(this.page, this.logger);
  }

  /** Navigate to home page of Trust Wallet extension
   *  - open the wallet extension
   *  - unlock extension (if needed)
   *  - close popovers (if needed)
   *  - cancel awaited transactions (if needed) */
  async navigate() {
    await test.step('Navigate to Trust wallet', async () => {
      this.page = await this.browserContext.newPage();
      await this.initLocators();
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.loginPage.unlock();
      await this.walletOperations.confirmHighRisk();
      await this.homePage.rejectTxInQueue();
      await this.homePage.closePopover();
    });
  }

  /** Checks the wallet is set correctly and starts the wallet setup as the first time (if needed) */
  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to /onboarding due to unexpected first time route from /home.html to /onboarding - page is close
      this.page = await this.browserContext.newPage();
      await this.initLocators();
      await this.page.goto(this.extensionUrl + '/home.html#/onboarding');
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
    });
  }

  /** Checks the is installed the needed network and add new network to wallet (if needed) */
  async setupNetwork(networkConfig: NetworkConfig) {
    await test.step(`Setup "${networkConfig.chainName}" Network`, async () => {
      await this.navigate();
      if (!(await this.homePage.isNetworkExists(networkConfig.chainName))) {
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
    // [High risk connection] Need to research before connecting the Trust wallet methods to widget tests
    // https://linear.app/lidofi/issue/QA-3382/high-risk-popup-before-connect-to-trust-wallet
    await test.step('Connect wallet', async () => {
      const txPage = new WalletOperations(page, this.logger);
      await txPage.confirmHighRisk();
      if (await txPage.connectBtn.isVisible()) {
        await txPage.connectBtn.click();
      } else {
        await txPage.confirmHighRisk();
      }
    });
  }

  /** Get the `amount` from transaction and comply with the `expectedAmount` */
  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      const txPage = new WalletOperations(page, this.logger);
      expect(parseFloat(await txPage.txAmountValue.textContent())).toBe(
        expectedAmount,
      );
    });
  }

  /** Confirm transaction */
  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      const txPage = new WalletOperations(page, this.logger);
      await expect(txPage.confirmBtn).toBeEnabled();
      await txPage.confirmBtn.click();
    });
  }

  /** Reject transaction */
  async cancelTx(page: Page) {
    await test.step('Cancel TX', async () => {
      const txPage = new WalletOperations(page, this.logger);
      await expect(txPage.rejectBtn).toBeEnabled();
      await txPage.rejectBtn.click();
    });
  }

  /** Confirm token approval transaction */
  async approveTokenTx(page: Page) {
    await test.step('Approve token TX', async () => {
      const txPage = new WalletOperations(page, this.logger);
      await expect(txPage.confirmBtn).toBeEnabled();
      await txPage.confirmBtn.click();
    });
  }

  /** Get the `address` from transaction and comply with the `expectedAddress` */
  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
      await new WalletOperations(page, this.logger).viewDetailsBtn.click();
      await page.getByText(expectedAddress).isVisible();
    });
  }

  async importKey() {
    throw new Error('Method not implemented.');
  }
}
