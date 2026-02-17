import { NetworkConfig } from '../../wallets.constants';
import { WalletPage, WalletPageOptions } from '../../wallet.page';
import { expect } from '@playwright/test';
import { test, Page } from '@playwright/test';
import {
  HomePage,
  LoginPage,
  OnboardingPage,
  WalletOperationPage,
  SettingsPage,
} from './pages';
import {
  Header,
  SettingsElement,
  PopoverElements,
  AccountMenu,
  NetworkList,
} from './pages/elements';
import { getAddress } from 'viem';
import { isPopularMainnetNetwork, isPopularTestnetNetwork } from './helper';
import { getNotificationPage } from '../../../utils/helper';

export class MetamaskPage implements WalletPage {
  page: Page | undefined;
  header: Header;
  homePage: HomePage;
  loginPage: LoginPage;
  walletOperation: WalletOperationPage;
  onboardingPage: OnboardingPage;
  settingsMenu: SettingsElement;
  networkList: NetworkList;
  popoverElements: PopoverElements;
  accountMenu: AccountMenu;

  constructor(public options: WalletPageOptions) {}

  async initLocators() {
    this.page = await this.options.browserContext.newPage();
    this.header = new Header(this.page);
    this.homePage = new HomePage(
      this.page,
      this.options.extensionUrl,
      this.options.walletConfig,
    );
    this.networkList = new NetworkList(this.page);
    this.loginPage = new LoginPage(this.page, this.options.accountConfig);
    this.walletOperation = new WalletOperationPage(this.page);
    this.onboardingPage = new OnboardingPage(
      this.page,
      this.options.accountConfig,
    );
    this.settingsMenu = new SettingsElement(this.page);
    this.popoverElements = new PopoverElements(this.page);
    this.accountMenu = new AccountMenu(this.page);
  }

  async navigate() {
    await test.step('Navigate to metamask Home page', async () => {
      await this.initLocators();
      await this.homePage.goto();
      try {
        await this.header.appHeaderLogo.waitFor({
          state: 'visible',
          timeout: 2000,
        });
      } catch {
        // Header logo is not visible
      }
      await this.popoverElements.closeConnectingProblemPopover();
      await this.loginPage.unlock();

      if (await this.header.accountMenuButton.isVisible()) {
        await this.popoverElements.closePopover();
        await this.walletOperation.cancelAllTxInQueue(); // reject all tx in queue if exist
      }
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to #onboarding due to unexpected first time route from /home.html to /onboarding ---> page is close
      await this.navigate();
      if (!(await this.header.accountMenuButton.isVisible())) {
        await this.onboardingPage.firstTimeSetup();
        await this.navigate();

        await test.step('Setup special wallet settings', async () => {
          const settingPage = new SettingsPage(
            await this.options.browserContext.newPage(),
            this.options.extensionUrl,
            this.options.walletConfig,
          );
          await settingPage.enableFullSizeView();
        });
      }
    });
  }

  async changeNetwork(networkName: string) {
    await test.step(`Change Metamask network to ${networkName}`, async () => {
      await this.navigate();
      await this.settingsMenu.openNetworksSettings();
      await this.networkList.clickToNetworkItemButton(networkName);
      if (networkName === 'Linea') {
        await this.popoverElements.closePopover(); //Linea network require additional confirmation
      }
      await this.page.close();
    });
  }

  async setupNetwork(networkConfig: NetworkConfig) {
    await test.step(`Setup "${networkConfig.chainName}" Network`, async () => {
      if (this.page.isClosed()) await this.navigate();
      await this.settingsMenu.openNetworksSettings();
      if (
        await this.networkList.isNetworkExist(
          networkConfig.chainName,
          networkConfig.rpcUrl,
          networkConfig.chainId,
        )
      ) {
        await this.networkList.clickToNetworkItemButton(
          networkConfig.chainName,
        );
      } else {
        await this.networkList.networkDisplayCloseBtn.click();
        await this.addNetwork(networkConfig);
      }
    });
  }

  async addNetwork(networkConfig: NetworkConfig) {
    await test.step(`Add new network "${networkConfig.chainName}"`, async () => {
      await this.navigate();
      if (await isPopularMainnetNetwork(networkConfig.chainName)) {
        await this.networkList.addPopularNetwork(networkConfig.chainName);
        if (networkConfig.rpcUrl) {
          await this.navigate();
          await this.networkList.addNetworkManually(networkConfig);
        }
      } else if (await isPopularTestnetNetwork(networkConfig.chainName)) {
        await this.networkList.addPopularTestnetNetwork(networkConfig);
      } else {
        await this.networkList.addNetworkManually(networkConfig);
        await this.changeNetwork(networkConfig.chainName);
      }
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      await this.navigate();

      await this.header.accountMenuButton.click();
      await this.accountMenu.addAccountWithKey(key);
    });
  }

  async connectWallet() {
    await test.step('Connect Metamask wallet', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      const operationPage = new WalletOperationPage(page);
      await operationPage.connectBtn.click(); // "Confirm" button to give permission
      await operationPage.page.close();
    });
  }

  async assertTxAmount(expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      const txAmount = await new WalletOperationPage(page).getTxAmount();
      if (txAmount) {
        expect(txAmount).toBe(expectedAmount);
      }
    });
  }

  async confirmAddTokenToWallet() {
    await test.step('Confirm add token to wallet', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      await new WalletOperationPage(page).addTokenButton.click();
    });
  }

  async openLastTxInEthplorer(txIndex = 0) {
    return await test.step('Open transaction in Ethplorer', async () => {
      await this.navigate();
      await this.homePage.openActivityTab();
      await this.homePage.openTxInfo(txIndex);
      return this.homePage.openTransactionEthplorerPage();
    });
  }

  async getTokenBalance(tokenName: string) {
    return await test.step(`Get ${tokenName} token balance`, async () => {
      await this.navigate();
      await this.homePage.openTokensTab();
      //Cannot find locator by exact text since need to find row by text "stETH"/"ETH" but "stETH" contains "ETH"
      const tokensValue = await this.homePage.tokensListItemValues.all();
      let tokenBalance = NaN;
      for (const value of tokensValue) {
        await value.waitFor({ state: 'visible' });
        const tokenNameFromValue = (await value.textContent())
          .match(/[a-zA-Z]+/g)
          .toString()
          .trim();
        if (tokenNameFromValue === tokenName) {
          await value.click();
          tokenBalance = parseFloat(
            await this.homePage.tokensListItemValues.textContent(),
          );
          break;
        }
      }
      await this.page.close();
      return tokenBalance;
    });
  }

  async confirmTx(setAggressiveGas?: boolean) {
    await test.step('Confirm TX', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      await new WalletOperationPage(page).confirmTransaction(setAggressiveGas);
    });
  }

  async cancelTx() {
    await test.step('Reject TX', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      await new WalletOperationPage(page).cancelTransaction();
    });
  }

  async approveTokenTx() {
    await test.step('Approve token TX', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      await new WalletOperationPage(page).confirmTransactionOfTokenApproval();
    });
  }

  async assertReceiptAddress(expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
      const page = await getNotificationPage(
        this.options.browserContext,
        this.options.extensionUrl,
      );
      const recipientAddress = await new WalletOperationPage(
        page,
      ).getReceiptAddress();
      expect(recipientAddress).toBe(expectedAddress);
    });
  }

  /** The `getWalletAddress()` function returns **the lower case** address */
  async getWalletAddress() {
    return await test.step('Get current wallet address', async () => {
      await this.navigate();
      await this.settingsMenu.openAccountSettings();
      const address =
        await this.popoverElements.accountDetailAddressLabel.textContent();
      await this.page.close();
      return getAddress(address).toLowerCase();
    });
  }

  async changeWalletAccountByAddress(address: string, isClosePage = false) {
    await test.step('Change wallet account by address', async () => {
      await this.navigate();
      await this.header.accountMenuButton.click();
      await this.accountMenu.clickToAddress(address);
      if (isClosePage) await this.page.close();
    });
  }

  async isWalletAddressExist() {
    return false; // mm v-13.5.0 doesn't display addresses in the wallet list
  }

  async changeWalletAccountByName(accountName: string, isClosePage = true) {
    await test.step('Change wallet account', async () => {
      await this.navigate();
      await this.header.accountMenuButton.click();
      await this.accountMenu.clickToAccount(accountName);
      const accountNumber = this.header.accountMenuButton
        .locator('..')
        .getByText(accountName);
      await accountNumber.waitFor({ state: 'visible', timeout: 2000 });
      await this.page.waitForTimeout(2000);
      if (isClosePage) await this.page.close();
    });
  }
}
