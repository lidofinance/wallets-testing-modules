import { NetworkConfig, WalletConnectTypes } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { test, Page, expect } from '@playwright/test';
import {
  AccountList,
  HomePage,
  LoginPage,
  ManageCryptoPage,
  NetworkList,
  OnboardingPage,
  WalletOperations,
} from './pages';
import {
  getCorrectNetworkName,
  closeUnnecessaryPages,
  isNeedAddNetwork,
} from './helper';
import { ConsoleLogger } from '@nestjs/common';
import { WalletPageOptions } from '../wallet.page';

export class OkxPage implements WalletPage<WalletConnectTypes.EOA> {
  logger = new ConsoleLogger(OkxPage.name);
  page: Page | undefined;
  homePage: HomePage;
  loginPage: LoginPage;
  onboardingPage: OnboardingPage;
  networkListPage: NetworkList;
  manageCryptoPage: ManageCryptoPage;
  accountList: AccountList;
  walletOperations: WalletOperations;

  constructor(public options: WalletPageOptions) {}

  /** Init all page objects Classes included to wallet */
  async initLocators() {
    this.page = await this.options.browserContext.newPage();
    this.homePage = new HomePage(this.page);
    this.loginPage = new LoginPage(this.page, this.options.accountConfig);
    this.onboardingPage = new OnboardingPage(
      this.page,
      this.options.accountConfig,
      this.options.extensionUrl +
        this.options.walletConfig.EXTENSION_START_PATH,
    );
    this.networkListPage = new NetworkList(this.page);
    this.manageCryptoPage = new ManageCryptoPage(this.page);
    this.accountList = new AccountList(this.page);
    this.walletOperations = new WalletOperations(this.page);
  }

  /** Open the home page of the wallet extension */
  async goto() {
    await this.page.goto(
      this.options.extensionUrl +
        this.options.walletConfig.EXTENSION_START_PATH,
    );
  }

  /** Navigate to home page of OXK Wallet extension:
   *  - open the wallet extension
   *  - unlock extension (if needed)
   *  - cancel awaited transactions (if needed)
   */
  async navigate() {
    await test.step('Navigate to OKX', async () => {
      await this.initLocators();
      await this.goto();
      await this.page.waitForLoadState('load');
      await this.loginPage.unlock();
      await this.walletOperations.cancelAllTxInQueue();
    });
  }

  /** Checks the wallet is set correctly and starts the wallet setup as the first time (if needed) */
  async setup() {
    await test.step('Setup', async () => {
      await this.navigate();
      try {
        await this.onboardingPage.importWalletButton.waitFor({
          timeout: 3000,
        });
        await this.onboardingPage.firstTimeSetup();
      } catch {
        this.logger.log('Import is not necessary');
      }
      await closeUnnecessaryPages(this.options.browserContext);
    });
  }

  /** Checks the is installed the needed network and add new network to wallet (if needed) */
  async setupNetwork(networkConfig: NetworkConfig) {
    await test.step(`Setup "${networkConfig.chainName}" Network`, async () => {
      await this.addNetwork(networkConfig);
    });
  }

  async importTokens(token: string) {
    await test.step('Import token', async () => {
      await this.navigate();
      await this.homePage.manageCryptoButton.click();
      await this.manageCryptoPage.importToken(token);
      await this.page.close();
    });
  }

  /** Get token balance from wallet extension using `tokenName` */
  async getTokenBalance(tokenName: string) {
    return await test.step(`Get ${tokenName} token balance`, async () => {
      await this.navigate();
      const amount = parseFloat(await this.homePage.getTokenBalance(tokenName));
      await this.page.close();
      return amount;
    });
  }

  /** Add new network to wallet */
  async addNetwork(networkConfig: NetworkConfig) {
    if (!(await isNeedAddNetwork(networkConfig.chainName))) {
      return;
    }
    await this.navigate();
    await this.homePage.networkListButton.click();
    if (
      !(await this.networkListPage.isNetworkExist(
        getCorrectNetworkName(networkConfig.chainName),
      ))
    ) {
      await this.networkListPage.addCustomNetwork(networkConfig);
    }
    await this.page.close();
  }

  /** Switch network in the wallet
   * - switch in wallet extension
   * - switch in the connected dApp (switch in the extension doesn't switch the dApp network, but we do it to sync states)
   * */
  async changeNetwork(networkName: string) {
    await test.step(`Switch network to "${networkName}"`, async () => {
      networkName = getCorrectNetworkName(networkName);
      await this.navigate();

      // switch network for wallet
      await this.homePage.networkListButton.click();
      await this.networkListPage.selectNetwork(networkName);

      // switch network for connected dApp
      await this.homePage.switchNetworkForDApp(
        this.options.extensionUrl +
          this.options.walletConfig.EXTENSION_START_PATH,
        networkName,
      );
      await this.page.close();
    });
  }

  /** To add new wallet address using wallet `privateKey` */
  async importKey(key: string) {
    await this.navigate();
    await this.homePage.accountListButton.click();
    await this.accountList.importKey(key);
    await this.page.close();
  }

  /** Click `Connect` button on the transaction `page` */
  async connectWallet(page: Page) {
    await test.step('Connect OKX wallet', async () => {
      const operationPage = new WalletOperations(page);
      await operationPage.connectButton.waitFor({
        state: 'visible',
        timeout: 10000,
      });
      await operationPage.connectButton.click();
      // need wait the page to be closed after the extension is connected
      await new Promise<void>((resolve) => {
        operationPage.page.on('close', () => {
          resolve();
        });
      });
    });
  }

  /** Get the `amount` from transaction and comply with the `expectedAmount` */
  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      const txAmount = await new WalletOperations(page).getTxAmount();
      if (txAmount) {
        expect(txAmount).toBe(expectedAmount);
      }
    });
  }

  /** Cancel transaction */
  async cancelTx(page: Page) {
    await test.step('Cancel TX', async () => {
      await new WalletOperations(page).cancelTxButton.click();
      await page.waitForEvent('close', { timeout: 30000 });
    });
  }

  /** Confirm transaction */
  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await new WalletOperations(page).confirmTxButton.click({
        timeout: 30000, // sometimes button is disabled awaits rpc
      });
    });
  }

  /** Approve token transaction */
  async approveTokenTx(page: Page) {
    await test.step('Approve token tx', async () => {
      const walletOperations = new WalletOperations(page);
      await walletOperations.confirmTxButton.click();
    });
  }

  /** Get the `address` from transaction and comply with the `expectedAddress` */
  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
      const recipientAddress = await new WalletOperations(
        page,
      ).getReceiptAddress();
      expect(recipientAddress).toBe(expectedAddress.toLowerCase());
    });
  }

  /** Confirm tx to add token to wallet */
  async confirmAddTokenToWallet(confirmPage: Page) {
    await test.step('Confirm add token to wallet', async () => {
      await new WalletOperations(confirmPage).confirmTxButton.click();
    });
  }

  /** The `getWalletAddress()` function returns **the lower case** address */
  async getWalletAddress() {
    return await test.step('Get current wallet address', async () => {
      await this.navigate();
      const address = await this.homePage.getWalletAddress();
      await this.page.close();
      return address.toLowerCase();
    });
  }

  async changeWalletAccountByName(accountName: string) {
    accountName = accountName === 'Account 1' ? 'Account 01' : accountName;
    await test.step('Change wallet account by address', async () => {
      await this.navigate();
      await this.homePage.accountListButton.click();
      await this.page.getByText(accountName).first().click();
      // need wait to set up address correct
      await this.page.waitForTimeout(2000);
      await this.page.close();
    });
  }

  // need realize for mainnet
  async openLastTxInEthplorer(txIndex = 0) {
    this.logger.log(
      `OKX wallet does not display the transaction history for testnet (param ${txIndex})`,
    );
    return null;
  }
}
