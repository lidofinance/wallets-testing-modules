import { Locator, Page, test } from '@playwright/test';
import { WidgetPage } from './widget.page';
import { BrowserService } from '@lidofinance/browser-service';
import {
  WalletPage,
  WalletConnectTypes,
} from '@lidofinance/wallets-testing-wallets';
import { WidgetConfig } from '../config';

export class StandWidgetPage implements WidgetPage {
  page: Page;
  walletPage: WalletPage;

  connectBtn: Locator;
  stakeInput: Locator;
  stakeSubmitBtn: Locator;
  enabledStakeSubmitBtn: Locator;

  headerAccountSection: Locator;
  providerName: Locator;
  ethAvailableToStakeValue: Locator;
  termsCheckbox: Locator;
  copyWcUrlBtn: Locator;
  closeModalBtn: Locator;

  constructor(
    browserService: BrowserService,
    public widgetConfig: WidgetConfig,
  ) {
    this.page = browserService.getBrowserContextPage();
    this.walletPage = browserService.getWalletPage();

    this.connectBtn = this.page.getByTestId('connectBtn');
    this.stakeInput = this.page.getByTestId('stakeInput');
    this.stakeSubmitBtn = this.page.getByTestId('stakeSubmitBtn');
    this.enabledStakeSubmitBtn = this.page.locator(
      'button[data-testid="stakeSubmitBtn"]:not([disabled])',
    );

    this.headerAccountSection = this.page.getByTestId('accountSectionHeader');
    this.providerName = this.page.locator('div[data-testid="providerName"]');
    this.ethAvailableToStakeValue = this.page.getByTestId(
      'ethAvailableToStake',
    );
    this.termsCheckbox = this.page.locator('input[type=checkbox]');
    this.copyWcUrlBtn = this.page.getByTestId('copy-wc2-uri');
    this.closeModalBtn = this.page.locator('div[role="dialog"] button').nth(0);
  }

  async goto(path?: string) {
    await this.page.goto(path);
  }

  async getWalletButtonByName(walletButtonName: string) {
    return this.page.getByRole('button').getByText(walletButtonName, {
      exact: true,
    });
  }

  async waitForPage(timeout?: number) {
    return this.page.context().waitForEvent('page', { timeout: timeout });
  }

  async closeModal() {
    await this.closeModalBtn.click();
  }

  async connectWallet() {
    // If wallet connected -> return
    if ((await this.connectBtn.count()) === 0) return;
    await this.connectBtn.first().click();
    await this.page.waitForTimeout(2000);
    // If Stake submit button is displayed -> return
    if ((await this.stakeSubmitBtn.count()) > 0) return;

    if (!(await this.termsCheckbox.isChecked()))
      await this.termsCheckbox.click({ force: true });

    const walletButton = await this.getWalletButtonByName(
      this.walletPage.options.walletConfig.CONNECT_BUTTON_NAME,
    );

    switch (this.walletPage.options.walletConfig.WALLET_TYPE) {
      case WalletConnectTypes.EOA: {
        await walletButton.dblclick();
        await this.walletPage.connectWallet();
        break;
      }
      case WalletConnectTypes.WC: {
        await walletButton.click();
        await this.page
          .getByTestId('wui-qr-code')
          .waitFor({ state: 'visible' });
        await this.copyWcUrlBtn.click();
        await this.walletPage.connectWallet(
          await this.page.evaluate(() => navigator.clipboard.readText()),
        );
        break;
      }
    }
  }

  // Function not tested with walletConnectTypes.WC
  async stake(txAmount: string) {
    await test.step('Fill stake input', async () => {
      await this.stakeInput.fill(txAmount);
      await this.enabledStakeSubmitBtn.waitFor({ timeout: 15000 });
    });

    await test.step('Click to staking button', async () => {
      await this.stakeSubmitBtn.click();
    });

    await this.walletPage.assertTxAmount(txAmount);
    await this.walletPage.assertReceiptAddress(this.widgetConfig.stakeContract);
    await this.walletPage.confirmTx(true);
    await this.page.waitForSelector(
      'text="Staking operation was successful."',
      { timeout: 90000 },
    );
  }
}
