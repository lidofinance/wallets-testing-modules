import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { expect } from '@playwright/test';
import { test, BrowserContext, Page } from '@playwright/test';
import { MainPage, LoginPage, SettingsPage } from './pages';
import {
  OnboardingPage,
  WalletOperationPage,
  Header,
  NetworkList,
  OptionsMenu,
  PopoverElements,
  AccountMenu,
} from './pages/elements';

export class MetamaskApp implements WalletPage {
  page: Page | undefined;
  header: Header;
  mainPage: MainPage;
  settingsPage: SettingsPage;
  loginPage: LoginPage;
  walletOperation: WalletOperationPage;
  onboardingPage: OnboardingPage;
  networkList: NetworkList;
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
    this.mainPage = new MainPage(this.page, this.extensionUrl, this.config);
    this.settingsPage = new SettingsPage(
      this.page,
      this.extensionUrl,
      this.config,
    );
    this.loginPage = new LoginPage(this.page, this.config);
    this.walletOperation = new WalletOperationPage(this.page);
    this.onboardingPage = new OnboardingPage(this.page, this.config);
    this.networkList = new NetworkList(this.page);
    this.optionsMenu = new OptionsMenu(this.page);
    this.popoverElements = new PopoverElements(this.page);
    this.accountMenu = new AccountMenu(this.page);
  }

  async navigate() {
    await test.step('Navigate to metamask', async () => {
      await this.initLocators();
      await this.mainPage.openWidgetPage();
      await this.header.appHeaderLogo.waitFor({ state: 'visible' });
      await this.loginPage.unlock();
      if (await this.header.networkListButton.isVisible()) {
        await this.popoverElements.closePopover();
        await this.walletOperation.rejectAllTxInQueue(); // reject all tx in queue if exist
      }
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to #onboarding due to unexpected first time route from /home.html to /onboarding -> page is close
      await this.navigate();
      if (!(await this.header.networkListButton.isVisible())) {
        await this.onboardingPage.firstTimeSetup();
        await this.popoverElements.closePopover();
        await this.walletOperation.rejectAllTxInQueue(); // reject all tx in queue if exist
        await this.settingsPage.setupNetworkChangingSetting(); // need to make it possible to change the wallet network
      }
    });
  }

  async changeNetwork(networkName: string) {
    await test.step(`Change Metamask network to ${networkName}`, async () => {
      await this.navigate();
      await this.header.networkListButton.click();
      await this.networkList.clickToNetwork(networkName);
      if (networkName === 'Linea Mainnet') {
        await this.popoverElements.closePopover(); //Linea network require additional confirmation
      }
      await this.page.close();
    });
  }

  async switchNetwork(networkName = 'Linea Mainnet') {
    await this.navigate();
    await this.header.networkListButton.click();
    await this.networkList.clickToNetwork(networkName);
    await this.popoverElements.gotItButton.click();
    await this.page.close();
  }

  async setupNetwork(standConfig: Record<string, any>) {
    const currentNetwork = await this.header.getCurrentNetworkName();
    if (currentNetwork.includes(standConfig.chainName)) {
      return;
    }
    await this.header.networkListButton.click();
    const networkListText = await this.networkList.getNetworkListText();
    if (networkListText.includes(standConfig.chainName)) {
      await this.networkList.clickToNetworkItemButton(standConfig.chainName);
    } else {
      await this.networkList.networkDisplayCloseBtn.click();
      await this.addNetwork(
        standConfig.chainName,
        standConfig.rpcUrl,
        standConfig.chainId,
        standConfig.tokenSymbol,
        standConfig.scan,
      );
    }
  }

  async addNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
    blockExplorer = '',
  ) {
    await test.step('Add network', async () => {
      await this.settingsPage.openSettings();
      await this.settingsPage.networksTabButton.click();
      await this.settingsPage.addNetworkManually(
        networkName,
        networkUrl,
        chainId,
        tokenSymbol,
        blockExplorer,
      );
      await this.popoverElements.switchToButton.click();
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
    await test.step('Connect wallet', async () => {
      const operationPage = new WalletOperationPage(page);
      await operationPage.nextButton.click(); // "Next" button for account select
      await operationPage.nextButton.click(); // "Confirm" button to give permission
      await operationPage.page.close();
    });
  }

  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      expect(await page.textContent('.currency-display-component__text')).toBe(
        expectedAmount,
      );
    });
  }

  async confirmAddTokenToWallet(confirmPage: Page) {
    await test.step('Confirm add token to wallet', async () => {
      await new WalletOperationPage(confirmPage).addTokenButton.click();
    });
  }

  async openLastTxInEthplorer(txIndex = 0) {
    await this.navigate();
    await this.mainPage.openActivityTab();
    await this.mainPage.openTxInfo(txIndex);
    return this.mainPage.openTransactionEthplorerPage();
  }

  async getTokenBalance(tokenName: string) {
    await this.navigate();
    await this.mainPage.openTokensTab();
    //Cannot find locator by exact text since need to find row by text "stETH"/"ETH" but "stETH" contains "ETH"
    const tokensValue = await this.mainPage.tokensListItemValues.all();
    let tokenBalance = NaN;
    for (const value of tokensValue) {
      await value.waitFor({ state: 'visible' });
      const tokenNameFromValue = (await value.textContent())
        .match(/[a-zA-Z]+/g)
        .toString()
        .trim();
      if (tokenNameFromValue === tokenName) {
        tokenBalance = parseFloat(await value.textContent());
        break;
      }
    }
    return tokenBalance;
  }

  async confirmTx(page: Page, setAggressiveGas?: boolean) {
    await test.step('Confirm TX', async () => {
      await new WalletOperationPage(page).confirmTransaction(setAggressiveGas);
    });
  }

  async signTx(page: Page) {
    await test.step('Sign TX', async () => {
      await new WalletOperationPage(page).signTransaction();
    });
  }

  async rejectTx(page: Page) {
    await test.step('Reject TX', async () => {
      await new WalletOperationPage(page).cancelTransaction();
    });
  }

  async approveTokenTx(page: Page) {
    await test.step('Approve token tx', async () => {
      await new WalletOperationPage(page).confirmTransactionOfTokenApproval();
    });
  }

  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
      const recipientAddress = await new WalletOperationPage(
        page,
      ).assertReceiptAddress();
      expect(recipientAddress).toBe(expectedAddress);
    });
  }

  async getWalletAddress() {
    await this.navigate();
    await this.header.optionsMenuButton.click();
    await this.optionsMenu.menuAccountDetailsButton.click();
    const address =
      await this.popoverElements.accountDetailCopyAddressButton.textContent();
    await this.page.close();
    return address;
  }

  async changeWalletAddress(addressName: string) {
    await this.navigate();
    await this.header.accountMenuButton.click();
    await this.accountMenu.clickToAddress(addressName);
    const accountNumber = this.header.accountMenuButton.getByText(addressName);
    await accountNumber.waitFor({ state: 'visible', timeout: 2000 });
    await this.page.waitForTimeout(2000);
    await this.page.close();
  }
}
