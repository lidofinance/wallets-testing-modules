import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import { expect } from '@playwright/test';
import { test, BrowserContext, Page } from '@playwright/test';
import { MainPage, LoginPage, SettingsPage } from './pages';
import {
  OnboardingElement,
  OperationActions,
  Header,
  NetworkList,
  OptionsMenu,
  PopoverElements,
  AccountMenu,
} from './pages/elements';

export class MetamaskPage implements WalletPage {
  page: Page | undefined;

  header: Header;
  mainPage: MainPage;
  settingsPage: SettingsPage;
  loginPage: LoginPage;
  networkList: NetworkList;
  optionsMenu: OptionsMenu;
  operationActions: OperationActions;
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
    this.networkList = new NetworkList(this.page);
    this.optionsMenu = new OptionsMenu(this.page);
    this.operationActions = new OperationActions(this.page);
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
        await this.closePopover();
      }
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to #onboarding due to unexpected first time route from /home.html to /onboarding -> page is close
      await this.navigate();
      if (!(await this.header.networkListButton.isVisible())) {
        await this.firstTimeSetup();
        await this.settingsPage.setupNetworkChangingSetting();
      }
    });
  }

  async closePopover() {
    await test.step('Close popover if it exists', async () => {
      if (!this.page) throw "Page isn't ready";

      if (await this.popoverElements.isPopoverVisible())
        await this.popoverElements.popoverCloseButton.click();

      if (await this.popoverElements.manageInSettingButton.isVisible())
        await this.popoverElements.manageInSettingButton.click();

      if (await this.popoverElements.notRightNowButton.isVisible())
        await this.popoverElements.notRightNowButton.click();

      if (await this.popoverElements.gotItButton.first().isVisible())
        await this.popoverElements.gotItButton.first().click();

      if (await this.popoverElements.noThanksButton.isVisible())
        await this.popoverElements.noThanksButton.click();

      // reject all tx in queue if exist
      await this.operationActions.rejectAllTxInQueue();
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      const onboardingPage = new OnboardingElement(this.page);
      await onboardingPage.confirmTermsOfOnboarding();
      await onboardingPage.importWalletButton.click();
      await onboardingPage.metricAgreeButton.click();
      await onboardingPage.fillSecretPhrase(this.config.SECRET_PHRASE);
      await onboardingPage.secretPhraseImportButton.click();
      await onboardingPage.createPassword(this.config.PASSWORD);
      await onboardingPage.completeButton.click();
      await onboardingPage.pinExtensionNextButton.click();
      await onboardingPage.pinExtensionDoneButton.click();
      await this.page.waitForURL('**/home.html#');
      await this.closePopover();
    });
  }

  async changeNetwork(networkName: string) {
    await test.step(`Change Metamask network to ${networkName}`, async () => {
      await this.navigate();
      await this.header.networkListButton.click();
      await this.networkList.clickToNetwork(networkName);
      //Linea network require additional confirmation
      if (networkName === 'Linea Mainnet') {
        await this.closePopover();
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

    if (!currentNetwork.includes(standConfig.chainName)) {
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
      await this.settingsPage.addNetworkButton.click();
      await this.settingsPage.addNetworkManuallyButton.click();
      await this.settingsPage.networkNameInput.fill(networkName);
      await this.settingsPage.networkRpcUrlInput.fill(networkUrl);
      await this.settingsPage.networkChainIdInput.fill(String(chainId));
      await this.settingsPage.networkTickerInput.fill(tokenSymbol);
      if (blockExplorer != '')
        await this.settingsPage.networkExplorerUrlInput.fill(blockExplorer);
      await this.settingsPage.saveNewTokenButton.click();
      await this.popoverElements.switchToButton.click();
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      // Remove me when MM to be more stable
      do {
        await this.page.reload();
        await this.closePopover();
      } while (!(await this.header.accountMenuButton.isVisible()));
      await this.header.accountMenuButton.click();
      await this.accountMenu.addAccountOrHardwareWalletButton.click();
      await this.accountMenu.importAccountButton.click();
      await this.accountMenu.privateKeyInput.fill(key);
      await this.accountMenu.importAccountConfirmButton.click();
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      const operationPage = new OperationActions(page);
      await page.click('text=Next');
      await operationPage.nextButton.click();
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
      const operationPage = new OperationActions(confirmPage);
      await operationPage.addTokenButton.click();
    });
  }

  async openLastTxInEthplorer(txIndex = 0) {
    if (!this.page) throw "Page isn't ready";
    await this.navigate();
    await this.mainPage.openActivityTab();
    await this.mainPage.activityList.nth(txIndex).click();
    const [etherscanPage] = await Promise.all([
      this.page.context().waitForEvent('page', { timeout: 10000 }),
      this.mainPage.transactionExplorerButton.click(),
    ]);
    return etherscanPage;
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
      const operationPage = new OperationActions(page);
      await operationPage.confirmTransaction(setAggressiveGas);
    });
  }

  async signTx(page: Page) {
    await test.step('Sign TX', async () => {
      const operationPage = new OperationActions(page);
      await operationPage.signTransaction();
    });
  }

  async rejectTx(page: Page) {
    await test.step('Reject TX', async () => {
      const operationPage = new OperationActions(page);
      await operationPage.cancelTransaction();
    });
  }

  async approveTokenTx(page: Page) {
    await test.step('Approve token tx', async () => {
      const operationPage = new OperationActions(page);
      await operationPage.confirmTransactionOfTokenApproval();
    });
  }

  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
      const operationAction = new OperationActions(page);
      const recipientAddress = await operationAction.assertReceiptAddress();
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
