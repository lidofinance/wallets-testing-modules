import { Page, test, expect } from '@playwright/test';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import { NetworkConfig, WalletConnectTypes } from '../wallets.constants';
import { ConsoleLogger } from '@nestjs/common';
import { SetupPage, SettingPage, TransactionPage } from './pages';

export class SafeIframePage implements WalletPage<WalletConnectTypes.IFRAME> {
  logger = new ConsoleLogger(SafeIframePage.name);
  page?: Page;

  safeUrl?: URL;
  setupPage: SetupPage;
  settingPage: SettingPage;

  constructor(public options: WalletPageOptions) {}

  async initLocators() {
    this.setupPage = new SetupPage(
      this.page,
      this.options.extensionPage,
      this.options.stand.chainId,
    );
    this.settingPage = new SettingPage(this.page);
  }

  /** Navigate to Safe Iframe
   * - Open Gnosis Safe app
   * - Connect EOA wallet and setup Safe
   * - Setup fork link (if needed)
   * - Open Stake Widget in iframe and connect wallet
   */
  async initIframeWallet() {
    await test.step('Init Safe wallet', async () => {
      this.page = this.options.browserContext.pages()[0];
      await this.initLocators();
      if (!this.safeUrl) {
        const safeAccountUrl = await this.setupPage.firstTimeSetupWallet();
        this.safeUrl = new URL(safeAccountUrl);

        // Fork for Safe is not working correctly now
        if (this.options.stand.forkUrl) {
          await this.navigate('envSetting');
          await this.settingPage.rpcUrlInput.fill(this.options.stand.forkUrl);
          await this.settingPage.saveSettingBtn.click();
        }
      }
      await this.page.goto(String(this.safeUrl));
    });
  }

  async navigate(pageName: 'lidoApp' | 'envSetting') {
    await this.page.goto(this.getUrl(pageName));
  }

  async getWalletAddress() {
    return this.safeUrl.searchParams.get('safe').slice(4);
  }

  /** Open Lido app and confirm wallet auto connection */
  async connectWallet() {
    await this.navigate('lidoApp');
    await test.step('Open Lido app in the Safe', async () => {
      await this.setupPage.closeExtraPopup();

      try {
        await this.setupPage.inAppContinueBtn.waitFor({
          state: 'visible',
          timeout: 3000,
        });
        await this.setupPage.inAppContinueBtn.click();
        await this.page.waitForTimeout(1000);
        try {
          await this.setupPage.inAppContinueBtn.waitFor({ timeout: 1000 });
          await this.setupPage.inAppContinueBtn.click();
        } catch {
          this.logger.log('The second continue button is not visible');
        }
      } catch {
        this.logger.log('Continue btn is not displayed');
      }
    });
  }

  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert contract address', async () => {
      const transactionPage = new TransactionPage(page);
      const contractAddress = await transactionPage.getContractOfTransaction();
      expect(contractAddress).toEqual(expectedAddress);
    });
  }

  async confirmTx(page: Page) {
    await test.step('Confirm transaction', async () => {
      const transactionPage = new TransactionPage(page);
      const extensionTxPage = await transactionPage.confirmTransaction();
      await this.options.extensionPage.confirmTx(extensionTxPage, true);
      await this.page.waitForSelector('text=Transaction was successful');
      await transactionPage.finishTxBtn.click();
    });
  }

  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert transaction amount', async () => {
      const transactionPage = new TransactionPage(page);
      const transactionAmount = await transactionPage.getTransactionAmount();
      expect(transactionAmount).toEqual(expectedAmount);
    });
  }

  async setupNetwork(networkConfig: NetworkConfig) {
    await this.options.extensionPage.setupNetwork(networkConfig);
  }

  async changeNetwork(networkName: string) {
    await this.options.extensionPage.changeNetwork(networkName);
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

  // SafePage does not support these methods
  setup(): Promise<void> {
    throw new Error('Unsupported method for WalletConnectTypes.IFRAME');
  }

  importKey(): Promise<void> {
    throw new Error('Unsupported method for WalletConnectTypes.IFRAME');
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

  private getUrl(pageName: 'lidoApp' | 'envSetting') {
    switch (pageName) {
      case 'lidoApp':
        return `${
          this.safeUrl.origin
        }/apps/open?safe=${this.safeUrl.searchParams.get('safe')}&appUrl=${
          this.options.stand.standUrl
        }`;
      case 'envSetting':
        return `${
          this.safeUrl.origin
        }/settings/environment-variables?safe=${this.safeUrl.searchParams.get(
          'safe',
        )}`;
    }
  }
}
