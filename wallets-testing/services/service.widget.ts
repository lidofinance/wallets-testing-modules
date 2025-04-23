import { ETHEREUM_WIDGET_CONFIG } from '../config';
import { WalletTypes } from '@lidofinance/wallets-testing-wallets';
import { test, expect } from '@playwright/test';
import { BrowserService } from '@lidofinance/browser-service';
import { WidgetPage } from '../pages/widget.page';
import { waitForTextContent } from '../utils/helpers';

export interface TxConfig {
  txAmount: string;
}

export class WidgetService {
  widgetPage: WidgetPage;

  constructor(private browserService: BrowserService) {
    this.widgetPage = new WidgetPage(
      this.browserService.getBrowserContextPage(),
    );
  }

  async navigate() {
    await test.step('Navigate to Ethereum widget', async () => {
      await this.widgetPage.goto(ETHEREUM_WIDGET_CONFIG.url);
    });
  }

  async connectWallet() {
    const walletPage = this.browserService.getWalletPage();

    await test.step(`Connect wallet ${walletPage.walletConfig.WALLET_NAME}`, async () => {
      await this.widgetPage.page.waitForTimeout(2000);
      // If wallet connected -> return
      if ((await this.widgetPage.connectBtn.count()) === 0) return;
      await this.widgetPage.connectBtn.first().click();
      await this.widgetPage.page.waitForTimeout(2000);
      // If Stake submit button is displayed -> return
      if ((await this.widgetPage.stakeSubmitBtn.count()) > 0) return;

      if (!(await this.widgetPage.termsCheckbox.isChecked()))
        await this.widgetPage.termsCheckbox.click({ force: true });

      const walletButton = await this.widgetPage.getWalletButtonByName(
        walletPage.walletConfig.CONNECT_BUTTON_NAME,
      );

      switch (walletPage.walletConfig.WALLET_TYPE) {
        case WalletTypes.EOA: {
          const [connectWalletPage] = await Promise.all([
            this.widgetPage.waitForPage(),
            walletButton.dblclick(),
          ]);
          await walletPage.connectWallet(connectWalletPage);
          break;
        }
        case WalletTypes.WC: {
          await walletButton.click();
          await this.widgetPage.copyWcUrlBtn.click();
          await walletPage.connectWallet(
            await this.widgetPage.page.evaluate(() =>
              navigator.clipboard.readText(),
            ),
          );
          break;
        }
      }
    });

    await test.step('Check the widget after wallet connection', async () => {
      await this.widgetPage.stakeSubmitBtn.waitFor({ timeout: 90000 });
      await this.widgetPage.headerAccountSection.click();
      expect(await this.widgetPage.providerName.textContent()).toContain(
        walletPage.walletConfig.CONNECTED_WALLET_NAME,
      );
      await this.widgetPage.closeAccountModal();
    });
  }

  async doStaking(txConfig: TxConfig) {
    await test.step('Do staking', async () => {
      await waitForTextContent(this.widgetPage.ethAvailableToStakeValue);
      await this.widgetPage.stakeInput.fill(txConfig.txAmount);
      await this.widgetPage.enabledStakeSubmitBtn.waitFor({ timeout: 15000 });
      const [walletSignPage] = await Promise.all([
        this.widgetPage.waitForPage(180000),
        this.widgetPage.stakeSubmitBtn.click(),
      ]);

      const walletPage = this.browserService.getWalletPage();
      await walletPage.assertTxAmount(walletSignPage, txConfig.txAmount);
      await walletPage.assertReceiptAddress(
        walletSignPage,
        ETHEREUM_WIDGET_CONFIG.stakeContract,
      );
      await walletPage.confirmTx(walletSignPage, true);
    });
  }
}
