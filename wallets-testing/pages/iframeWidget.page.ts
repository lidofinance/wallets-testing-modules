import { FrameLocator, Locator, Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';
import {
  WalletPage,
  WalletConnectTypes,
} from '@lidofinance/wallets-testing-wallets';
import { BrowserService } from '@lidofinance/browser-service';
import { WidgetPage } from './widget.page';
import { WidgetConfig } from '../config';

export class IframeWidgetPage implements WidgetPage {
  logger = new ConsoleLogger(IframeWidgetPage.name);
  walletPage: WalletPage<WalletConnectTypes.IFRAME>;
  app: FrameLocator;
  page: Page;

  connectBtn: Locator;
  stakeInput: Locator;
  stakeSubmitBtn: Locator;
  enabledStakeSubmitBtn: Locator;

  headerAccountSection: Locator;
  providerName: Locator;
  ethAvailableToStakeValue: Locator;
  termsCheckbox: Locator;
  copyWcUrlBtn: Locator;
  closeAccountModalBtn: Locator;

  constructor(
    browserService: BrowserService,
    public widgetConfig: WidgetConfig,
  ) {
    this.walletPage = browserService.getWalletPage();
    this.page = browserService.getBrowserContextPage();
    this.app = this.page.locator('iframe').first().contentFrame();

    this.connectBtn = this.app
      .getByRole('button')
      .getByText('Connect', { exact: true });
    this.stakeInput = this.app.getByTestId('stakeInput');
    this.stakeSubmitBtn = this.app.getByTestId('stakeSubmitBtn');
    this.enabledStakeSubmitBtn = this.app.locator(
      'button[data-testid="stakeSubmitBtn"]:not([disabled])',
    );

    this.headerAccountSection = this.app.getByTestId('accountSectionHeader');
    this.providerName = this.app.locator('div[data-testid="providerName"]');
    this.ethAvailableToStakeValue = this.app.getByTestId('ethAvailableToStake');
    this.termsCheckbox = this.app.getByRole('checkbox').locator('..');
    this.copyWcUrlBtn = this.app.locator('.wcm-action-btn');
    this.closeAccountModalBtn = this.app
      .locator('div[role="dialog"] button')
      .nth(0);
  }

  async connectWallet() {
    await test.step('Connect wallet to Lido app in Safe', async () => {
      await this.walletPage.connectWallet();
      await this.app
        .getByText('Stake Ether')
        .waitFor({ timeout: 15000, state: 'visible' });
      try {
        await this.connectBtn.waitFor({
          timeout: 2000,
          state: 'visible',
        });
        await test.step('Connect wallet', async () => {
          await this.termsCheckbox.click();
          await this.connectBtn.click();
        });
      } catch {
        this.logger.log('No need to connect wallet');
      }
    });
  }

  async confirmStakeTx(txAmount: string) {
    await this.stakeSubmitBtn.click();
    await this.walletPage.assertTxAmount(this.page, txAmount);
    await this.walletPage.assertReceiptAddress(
      this.page,
      this.widgetConfig.stakeContract,
    );
    await this.walletPage.confirmTx(this.page, true);

    await this.app
      .getByText('Staking operation was successful.')
      .waitFor({ state: 'visible', timeout: 90000 });
  }

  async waitForPage(timeout?: number) {
    return this.page.context().waitForEvent('page', { timeout: timeout });
  }

  async closeAccountModal() {
    await this.closeAccountModalBtn.click();
  }
}
