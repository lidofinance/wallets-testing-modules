import { Page, test } from '@playwright/test';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import { NetworkConfig, WalletConnectTypes } from '../wallets.constants';
import { ConsoleLogger } from '@nestjs/common';
import { SetupPage, SettingPage, TransactionPage } from './pages';
import { WCSessionRequest } from '../walletConnect/wc.service';

export class SafeIframePage implements WalletPage<WalletConnectTypes.IFRAME> {
  logger = new ConsoleLogger(SafeIframePage.name);
  page: Page;
  safeUrl: URL;
  setupPage: SetupPage;
  settingPage: SettingPage;

  constructor(public options: WalletPageOptions) {}

  async initLocators(page?: Page) {
    if (!page) {
      this.page = await this.options.browserContext.newPage();
    } else {
      this.page = page;
    }
    this.setupPage = new SetupPage(
      this.page,
      this.options.extensionPage,
      this.options.standConfig.chainId,
    );
    this.settingPage = new SettingPage(this.page);
  }

  /** Navigate to Safe Iframe
   * - Setup Extension wallet
   * - Open Gnosis Safe app
   * - Connect EOA wallet and setup Safe
   * - Setup fork link (if needed)
   */
  async setup() {
    await this.options.extensionPage.setup();

    await test.step('Init Safe wallet', async () => {
      await this.initLocators();
      const safeAccountUrl = await this.setupPage.firstTimeSetupWallet();
      this.safeUrl = new URL(safeAccountUrl);

      await test.step('Setup RPC url', async () => {
        await this.navigate('envSetting');
        await this.settingPage.rpcUrlInput.fill(
          this.options.standConfig.rpcUrl,
        );
        await this.settingPage.saveSettingBtn.click();
      });
      await this.page.goto(String(this.safeUrl));
    });
  }

  async navigate(pageName: 'lidoApp' | 'envSetting') {
    await this.page.goto(this.getNavigationUrl(pageName));
  }

  private getNavigationUrl(pageName: 'lidoApp' | 'envSetting') {
    switch (pageName) {
      case 'lidoApp':
        return `${
          this.safeUrl.origin
        }/apps/open?safe=${this.safeUrl.searchParams.get('safe')}&appUrl=${
          this.options.standConfig.standUrl
        }`;
      case 'envSetting':
        return `${
          this.safeUrl.origin
        }/settings/environment-variables?safe=${this.safeUrl.searchParams.get(
          'safe',
        )}`;
    }
  }

  async getWalletAddress() {
    return this.safeUrl.searchParams.get('safe').slice(4);
  }

  /** Open Lido app and confirm wallet auto connection */
  async connectWallet() {
    await this.initLocators(this.options.browserContext.pages()[0]);
    await this.navigate('lidoApp');
    await test.step('Open Lido app in the Safe', async () => {
      let isWidgetOpen = false;
      while (!isWidgetOpen) {
        try {
          await this.setupPage.waitForVisible(
            this.setupPage.inAppContinueBtn,
            2000,
          );
          await this.setupPage.inAppContinueBtn.click({ timeout: 2000 });
        } catch {
          if (
            await this.page
              .locator('iframe')
              .first()
              .contentFrame()
              .getByText('Stake Ether')
              .isVisible()
          )
            isWidgetOpen = true;
        }
      }
    });
  }

  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert of receipt address', async () => {
      await new TransactionPage(
        page,
        this.options.extensionPage,
      ).assertsContractOfTransaction(expectedAddress);
    });
  }

  async confirmTx(page: Page | WCSessionRequest) {
    await test.step('Confirm transaction', async () => {
      const transactionPage = new TransactionPage(
        page as Page,
        this.options.extensionPage,
      );
      await transactionPage.confirmTransaction();
      await this.page.waitForSelector('text=Transaction was successful', {
        timeout: 180000,
      });
      await transactionPage.finishTxBtn.click();
    });
  }

  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert of transaction amount', async () => {
      await new TransactionPage(
        page,
        this.options.extensionPage,
      ).assertTransactionAmount(expectedAmount);
    });
  }

  /** Setup network to the extension wallet */
  async setupNetwork(networkConfig: NetworkConfig) {
    await this.options.extensionPage.setupNetwork(networkConfig);
  }

  /** Change network in the extension wallet */
  async changeNetwork(networkName: string) {
    await this.options.extensionPage.changeNetwork(networkName);
  }

  /** Check the wallet address exists in the extension wallet */
  async isWalletAddressExist(address: string) {
    return await this.options.extensionPage.isWalletAddressExist(address);
  }

  /** Import key to the extension wallet */
  async importKey(secretKey: string) {
    await this.options.extensionPage.importKey(secretKey);
  }

  /** Change account in the extension wallet */
  async changeWalletAccountByAddress(address: string) {
    await this.options.extensionPage.changeWalletAccountByAddress(address);
  }

  cancelTx(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  approveTokenTx?(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getTokenBalance?(): Promise<number> {
    throw new Error('Method not implemented.');
  }

  openLastTxInEthplorer?(): Promise<Page> {
    throw new Error('Unsupported method for WalletConnectTypes.IFRAME');
  }

  confirmAddTokenToWallet?(): Promise<void> {
    throw new Error('Unsupported method for WalletConnectTypes.IFRAME');
  }

  addNetwork(): Promise<void> {
    throw new Error('Unsupported method for WalletConnectTypes.IFRAME');
  }
}
