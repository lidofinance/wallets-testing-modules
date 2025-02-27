import { NetworkConfig, WalletConfig } from '../../wallets.constants';
import { WalletPage } from '../wallet.page';
import { expect } from '@playwright/test';
import { test, BrowserContext, Page } from '@playwright/test';
import { HomePage, LoginPage, SettingsPage } from './pages';
import {
  OnboardingPage,
  WalletOperationPage,
  Header,
  OptionsMenu,
  PopoverElements,
  AccountMenu,
} from './pages/elements';
import { getAddress } from 'viem';
import { isPopularNetwork } from './helper';

export class MetamaskPage implements WalletPage<'EOA'> {
  page: Page | undefined;
  header: Header;
  homePage: HomePage;
  loginPage: LoginPage;
  walletOperation: WalletOperationPage;
  onboardingPage: OnboardingPage;
  optionsMenu: OptionsMenu;
  popoverElements: PopoverElements;
  accountMenu: AccountMenu;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async initLocators() {
    this.page = await this.browserContext.newPage();
    this.header = new Header(this.page);
    this.homePage = new HomePage(this.page, this.extensionUrl, this.config);
    this.loginPage = new LoginPage(this.page, this.config);
    this.walletOperation = new WalletOperationPage(this.page);
    this.onboardingPage = new OnboardingPage(this.page, this.config);
    this.optionsMenu = new OptionsMenu(this.page);
    this.popoverElements = new PopoverElements(this.page);
    this.accountMenu = new AccountMenu(this.page);
  }

  async navigate() {
    await test.step('Navigate to metamask Home page', async () => {
      await this.initLocators();
      await this.homePage.openWidgetPage();
      await this.header.appHeaderLogo.waitFor({ state: 'visible' });
      await this.loginPage.unlock();
      if (await this.header.networkListButton.isVisible()) {
        await this.popoverElements.closePopover();
        await this.walletOperation.cancelAllTxInQueue(); // reject all tx in queue if exist
      }
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to #onboarding due to unexpected first time route from /home.html to /onboarding ---> page is close
      await this.navigate();
      if (!(await this.header.networkListButton.isVisible())) {
        await this.onboardingPage.firstTimeSetup();
        await this.popoverElements.closePopover();
        await this.walletOperation.cancelAllTxInQueue(); // reject all tx in queue if exist
        await new SettingsPage(
          await this.browserContext.newPage(),
          this.extensionUrl,
          this.config,
        ).setupNetworkChangingSetting(); // need to make it possible to change the wallet network
      }
    });
  }

  async changeNetwork(networkName: string) {
    await test.step(`Change Metamask network to ${networkName}`, async () => {
      await this.navigate();
      await this.header.networkListButton.click();
      await this.header.networkList.clickToNetwork(networkName);
      if (networkName === 'Linea') {
        await this.popoverElements.closePopover(); //Linea network require additional confirmation
      }
      await this.page.close();
    });
  }

  async setupNetwork(networkConfig: NetworkConfig) {
    await test.step(`Setup "${networkConfig.chainName}" Network`, async () => {
      await this.header.networkListButton.click();
      if (
        await this.header.networkList.isNetworkExist(
          networkConfig.chainName,
          networkConfig.rpcUrl,
          networkConfig.chainId,
        )
      ) {
        await this.header.networkList.clickToNetworkItemButton(
          networkConfig.chainName,
        );
      } else {
        await this.header.networkList.networkDisplayCloseBtn.click();
        await this.addNetwork(networkConfig);
      }
    });
  }

  async addNetwork(networkConfig: NetworkConfig, isClosePage = false) {
    await test.step(`Add new network "${networkConfig.chainName}"`, async () => {
      await this.navigate();
      if (await isPopularNetwork(networkConfig.chainName)) {
        await this.header.networkList.addPopularNetwork(
          networkConfig.chainName,
        );
      } else {
        await this.header.networkList.addNetworkManually(networkConfig);
      }
      if (isClosePage) await this.page.close();
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      await this.navigate();

      // Remove me when MM to be more stable
      do {
        await this.page.reload();
        await this.popoverElements.closePopover();
      } while (!(await this.header.accountMenuButton.isVisible()));

      await this.header.accountMenuButton.click();
      await this.accountMenu.addAccountWithKey(key);
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect Metamask wallet', async () => {
      const operationPage = new WalletOperationPage(page);
      await operationPage.connectBtn.click(); // "Confirm" button to give permission
      await operationPage.page.close();
    });
  }

  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      const txAmount = await new WalletOperationPage(page).getTxAmount();
      if (txAmount) {
        expect(txAmount).toBe(expectedAmount);
      }
    });
  }

  async confirmAddTokenToWallet(confirmPage: Page) {
    await test.step('Confirm add token to wallet', async () => {
      await new WalletOperationPage(confirmPage).addTokenButton.click();
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

  async confirmTx(page: Page, setAggressiveGas?: boolean) {
    await test.step('Confirm TX', async () => {
      await new WalletOperationPage(page).confirmTransaction(setAggressiveGas);
    });
  }

  async cancelTx(page: Page) {
    await test.step('Reject TX', async () => {
      await new WalletOperationPage(page).cancelTransaction();
    });
  }

  async approveTokenTx(page: Page) {
    await test.step('Approve token TX', async () => {
      await new WalletOperationPage(page).confirmTransactionOfTokenApproval();
    });
  }

  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
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
      await this.header.optionsMenuButton.click();
      await this.optionsMenu.menuAccountDetailsButton.click();
      const address =
        await this.popoverElements.accountDetailAddressLabel.textContent();
      await this.page.close();
      return getAddress(address).toLowerCase();
    });
  }

  async changeWalletAccountByAddress(address: string) {
    await test.step('Change wallet account by address', async () => {
      await this.navigate();
      await this.header.accountMenuButton.click();
      await this.accountMenu.clickToAddress(address);
    });
  }

  async isWalletAddressExist(address: string) {
    return await test.step(`Checking to the wallet address ${address} is exist`, async () => {
      await this.navigate();
      await this.header.accountMenuButton.click();
      const listOfAddress = await this.accountMenu.getListOfAddress();

      const addressStart = address.slice(0, 7).toLowerCase();
      const addressEnd = address.slice(-5).toLowerCase();

      const isExist = listOfAddress.some(
        (listAddress) =>
          listAddress.toLowerCase().startsWith(addressStart) &&
          listAddress.toLowerCase().endsWith(addressEnd),
      );
      await this.page.close();
      return isExist;
    });
  }

  async changeWalletAccountByName(accountName: string) {
    await test.step('Change wallet account', async () => {
      await this.navigate();
      await this.header.accountMenuButton.click();
      await this.accountMenu.clickToAccount(accountName);
      const accountNumber =
        this.header.accountMenuButton.getByText(accountName);
      await accountNumber.waitFor({ state: 'visible', timeout: 2000 });
      await this.page.waitForTimeout(2000);
      await this.page.close();
    });
  }
}
