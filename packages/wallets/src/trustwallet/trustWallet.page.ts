import { NetworkConfig } from '../wallets.constants';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import { test, Page, expect } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';
import {
  OnboardingPage,
  SettingPage,
  HomePage,
  WalletOperations,
  LoginPage,
} from './pages';
import { closeUnnecessaryPages } from '../okx/helper';
import { getNotificationPage } from '../../utils/helper';

export class TrustWalletPage implements WalletPage {
  logger = new ConsoleLogger(TrustWalletPage.name);
  page?: Page;

  onboardingPage: OnboardingPage;
  settingsPage: SettingPage;
  homePage: HomePage;
  walletOperations: WalletOperations;

  constructor(public options: WalletPageOptions) {}

  async initLocators() {
    this.onboardingPage = new OnboardingPage(
      this.page,
      this.options.accountConfig,
    );
    this.settingsPage = new SettingPage(this.page);
    this.homePage = new HomePage(this.page);
    this.walletOperations = new WalletOperations(this.page);
  }

  /** Navigate to home page of Trust Wallet extension
   *  - open the wallet extension
   *  - unlock extension (if needed)
   *  - close popovers (if needed)
   *  - cancel awaited transactions (if needed) */
  async navigate() {
    await test.step('Navigate to Trust wallet', async () => {
      this.page = await this.options.browserContext.newPage();
      await this.initLocators();
      await this.page.goto(
        this.options.extensionUrl +
          this.options.walletConfig.EXTENSION_START_PATH,
      );
      await new LoginPage(this.page, this.options.accountConfig).unlock();
      await this.walletOperations.confirmHighRisk();
      await this.homePage.rejectTxInQueue();
      await this.homePage.closePopover();
    });
  }

  /** Checks the wallet is set correctly and starts the wallet setup as the first time (if needed) */
  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to /onboarding due to unexpected first time route from /home.html to /onboarding - page is close
      this.page = await this.options.browserContext.newPage();
      await this.initLocators();
      await this.page.goto(
        this.options.extensionUrl + '/home.html#/onboarding',
      );
      await this.onboardingPage.firstTimeSetup();
    });
    await closeUnnecessaryPages(this.options.browserContext);
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
  async connectWallet() {
    // [High risk connection] Need to research before connecting the Trust wallet methods to widget tests
    // https://linear.app/lidofi/issue/QA-3382/high-risk-popup-before-connect-to-trust-wallet
    await test.step('Connect wallet', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );

      await new LoginPage(page, this.options.accountConfig).unlock();

      const txPage = new WalletOperations(page);
      try {
        await txPage.connectBtn.waitFor({ timeout: 5000, state: 'visible' });
        await txPage.connectBtn.click();
      } catch (er) {
        await txPage.confirmHighRisk();
      }
    });
  }

  /** Get the `amount` from transaction and comply with the `expectedAmount` */
  async assertTxAmount(expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      const txPage = new WalletOperations(page);
      expect(parseFloat(await txPage.txAmountValue.textContent())).toBe(
        expectedAmount,
      );
    });
  }

  /** Confirm transaction */
  async confirmTx() {
    await test.step('Confirm TX', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      const txPage = new WalletOperations(page);
      await expect(txPage.confirmBtn).toBeEnabled();
      await txPage.confirmBtn.click();
    });
  }

  /** Reject transaction */
  async cancelTx() {
    await test.step('Cancel TX', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      const txPage = new WalletOperations(page);
      await expect(txPage.rejectBtn).toBeEnabled();
      await txPage.rejectBtn.click();
    });
  }

  /** Get the `address` from transaction and comply with the `expectedAddress` */
  async assertReceiptAddress(expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      await new WalletOperations(page).viewDetailsBtn.click();
      await page.getByText(expectedAddress).isVisible();
    });
  }

  async importKey() {
    throw new Error('Method not implemented.');
  }
}
