import { ETHEREUM_WIDGET_CONFIG, TxConfig } from '../utils/consts';
import expect from 'expect';
import { WalletTypes } from '@lidofinance/wallets-testing-wallets';
import { Page, test } from '@playwright/test';
import { BrowserService } from '@lidofinance/browser-service';
import { WidgetPage } from '../pages/widget.page';
import { waitForTextContent } from '../utils/helpers';

export class WidgetService {
  page: Page;
  widgetPage: WidgetPage;

  constructor(private browserService: BrowserService) {
    this.page = this.browserService.getBrowserContextPage();
    this.widgetPage = new WidgetPage(this.page);
  }

  async navigate() {
    await test.step('Navigate to Ethereum widget', async () => {
      await this.page.goto(ETHEREUM_WIDGET_CONFIG.url);
    });
  }

  async connectWallet() {
    const walletPage = this.browserService.getWalletPage();

    await test.step(`Connect wallet ${walletPage.walletConfig.WALLET_NAME}`, async () => {
      await this.page.waitForTimeout(2000);
      // If wallet connected -> return
      if ((await this.widgetPage.connectBtn.count()) === 0) return;
      await this.widgetPage.connectBtn.first().click();
      await this.page.waitForTimeout(2000);
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
            this.page.context().waitForEvent('page'),
            walletButton.dblclick(),
          ]);
          await walletPage.connectWallet(connectWalletPage);
          break;
        }
        case WalletTypes.WC: {
          await walletButton.click();
          await this.widgetPage.copyWcUrlBtn.click();
          await walletPage.connectWallet(
            await this.page.evaluate(() => navigator.clipboard.readText()),
          );
          break;
        }
      }
    });

    await test.step('Check the widget after wallet connection', async () => {
      expect(
        await this.page.waitForSelector('data-testid=stakeSubmitBtn'),
      ).not.toBeNaN();
      await this.widgetPage.headerAccountSection.click();
      expect(await this.widgetPage.providerName.textContent()).toContain(
        walletPage.walletConfig.CONNECTED_WALLET_NAME,
      );
      await this.page.locator('div[role="dialog"] button').nth(0).click();
    });
  }

  async doStaking(txConfig: TxConfig) {
    await test.step('Do staking', async () => {
      await waitForTextContent(this.widgetPage.ethAvailableToStakeValue);
      await this.widgetPage.stakeInput.fill(txConfig.txAmount);
      await this.page.waitForSelector(
        'button[data-testid="stakeSubmitBtn"]:not([disabled])',
        { timeout: 15000 },
      );
      const [walletSignPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 180000 }),
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
