import { ETHEREUM_WIDGET_CONFIG } from './ethereum.constants';
import { StakeConfig } from '../widgets.constants';
import { WidgetPage } from '../widgets.page';
import expect from 'expect';
import { Logger } from '@nestjs/common';
import { WalletPage, WalletTypes } from '@lidofinance/wallets-testing-wallets';
import { Locator, Page, test } from '@playwright/test';

export class EthereumPage implements WidgetPage {
  private readonly logger = new Logger(EthereumPage.name);
  page: Page;
  connectBtn: Locator;
  stakeSubmitBtn: Locator;
  termsCheckbox: Locator;
  copyWcUrlBtn: Locator;

  constructor(page: Page, private stakeConfig: StakeConfig) {
    this.page = page;
    this.connectBtn = this.page.getByTestId('connectBtn');
    this.stakeSubmitBtn = this.page.getByTestId('stakeSubmitBtn');
    this.termsCheckbox = this.page.locator('input[type=checkbox]');
    this.copyWcUrlBtn = this.page.locator('.wcm-action-btn');
  }

  async navigate() {
    await test.step('Navigate to Ethereum widget', async () => {
      await this.page.goto(ETHEREUM_WIDGET_CONFIG.url);
    });
  }

  async waitForTextContent(locator: Locator) {
    return await locator.evaluate(async (element) => {
      return new Promise<string>((resolve) => {
        const checkText = () => {
          const text = element.textContent.trim();
          if (text.length > 0) {
            resolve(text);
          } else {
            requestAnimationFrame(checkText);
          }
        };
        requestAnimationFrame(checkText);
      });
    });
  }

  async connectWallet(walletPage: WalletPage<WalletTypes>) {
    await test.step(`Connect wallet ${walletPage.config.COMMON.WALLET_NAME}`, async () => {
      await this.page.waitForTimeout(2000);
      // If wallet connected -> return
      if ((await this.connectBtn.count()) === 0) return;
      await this.connectBtn.first().click();
      await this.page.waitForTimeout(2000);
      // If Stake submit button is displayed -> return
      if ((await this.stakeSubmitBtn.count()) > 0) return;

      if (!(await this.termsCheckbox.isChecked()))
        await this.termsCheckbox.click({ force: true });

      const walletButton = this.page
        .getByRole('button')
        .getByText(walletPage.config.COMMON.CONNECT_BUTTON_NAME, {
          exact: true,
        });

      switch (walletPage.type) {
        case WalletTypes.EOA: {
          const [connectWalletPage] = await Promise.all([
            this.page.context().waitForEvent('page', { timeout: 5000 }),
            walletButton.click(),
          ]);
          await walletPage.connectWallet(connectWalletPage);
          break;
        }
        case WalletTypes.WC: {
          await walletButton.click();
          await this.copyWcUrlBtn.click();
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
      await this.page.locator('data-testid=accountSectionHeader').click();
      expect(
        await this.page.textContent('div[data-testid="providerName"]'),
      ).toContain(walletPage.config.COMMON.CONNECTED_WALLET_NAME);
      await this.page.locator('div[role="dialog"] button').nth(0).click();
    });
  }

  async doStaking(walletPage: WalletPage<WalletTypes.EOA>) {
    await test.step('Do staking', async () => {
      await this.waitForTextContent(
        this.page
          .getByTestId('stakeCardSection')
          .getByTestId('ethAvailableToStake'),
      );
      await this.waitForTextContent(
        this.page
          .getByTestId('stakeCardSection')
          .getByTestId('ethAvailableToStake'),
      );
      await this.page
        .getByTestId('stakeInput')
        .fill(String(this.stakeConfig.stakeAmount));
      await this.page.waitForSelector(
        'button[data-testid="stakeSubmitBtn"]:not([disabled])',
        { timeout: 15000 },
      );
      const [walletSignPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 180000 }),
        this.page.click('data-testid=stakeSubmitBtn'),
      ]);

      await walletPage.assertTxAmount(
        walletSignPage,
        String(this.stakeConfig.stakeAmount),
      );
      await walletPage.assertReceiptAddress(
        walletSignPage,
        String(ETHEREUM_WIDGET_CONFIG.stakeContract),
      );
      await walletPage.confirmTx(walletSignPage, true);
    });
  }
}
