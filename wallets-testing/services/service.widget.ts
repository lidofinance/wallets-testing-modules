import { WidgetConfig } from '../config';
import { expect, test } from '@playwright/test';
import { BrowserService } from '@lidofinance/browser-service';
import { WIDGET_PAGE, WidgetPage } from '../pages';
import { waitForTextContent } from '../utils/helpers';
import { WalletConnectTypes } from '@lidofinance/wallets-testing-wallets';

export class WidgetService {
  widgetPage: WidgetPage;

  constructor(
    private browserService: BrowserService,
    public widgetConfig: WidgetConfig,
  ) {
    this.widgetPage = new WIDGET_PAGE[
      this.browserService.options.walletConfig.WALLET_TYPE
    ](this.browserService, this.widgetConfig);
  }

  async navigate() {
    await test.step('Navigate to Ethereum widget', async () => {
      await this.widgetPage.goto(this.widgetConfig.url);
    });
  }

  async connectWallet() {
    await test.step(`Connect wallet ${this.widgetPage.walletPage.options.walletConfig.WALLET_NAME}`, async () => {
      switch (this.widgetPage.walletPage.options.walletConfig.WALLET_TYPE) {
        case WalletConnectTypes.EOA:
        case WalletConnectTypes.WC:
          await this.navigate();
          await this.widgetPage.connectWallet();
          break;
        case WalletConnectTypes.IFRAME:
          await this.widgetPage.connectWallet();
      }
    });

    await test.step('Check the widget after wallet connection', async () => {
      await this.widgetPage.stakeSubmitBtn.waitFor({ timeout: 90000 });
      await this.widgetPage.headerAccountSection.click();
      expect(await this.widgetPage.providerName.textContent()).toContain(
        this.widgetPage.walletPage.options.walletConfig.CONNECTED_WALLET_NAME,
      );
      await this.widgetPage.closeAccountModal();
    });
  }

  // Function not tested with walletConnectTypes.WC
  async doStaking(txAmount: string) {
    await test.step('Do staking', async () => {
      await waitForTextContent(this.widgetPage.ethAvailableToStakeValue);
      await this.widgetPage.stakeInput.fill(txAmount);
      await this.widgetPage.enabledStakeSubmitBtn.waitFor({ timeout: 15000 });
      await this.widgetPage.confirmStakeTx(txAmount);
    });
  }
}
