import { ETHEREUM_WIDGET_CONFIG } from './ethereum.constants';
import { StakeConfig } from '../widgets.constants';
import { WidgetPage } from '../widgets.page';
import expect from 'expect';
import { Logger } from '@nestjs/common';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';
import { test, Page, Locator } from '@playwright/test';

export class EthereumPage implements WidgetPage {
  private readonly logger = new Logger(EthereumPage.name);
  page: Page;

  constructor(page: Page, private stakeConfig: StakeConfig) {
    this.page = page;
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

  async connectWallet(walletPage: WalletPage) {
    await test.step(
      'Connect wallet ' + walletPage.config.COMMON.WALLET_NAME,
      async () => {
        await this.page.waitForTimeout(2000);
        const isConnected =
          (await this.page.getByTestId('connectBtn').count()) === 0;
        if (!isConnected) {
          await this.page.getByTestId('connectBtn').first().click();
          await this.page.waitForTimeout(2000);
          if ((await this.page.getByTestId('stakeSubmitBtn').count()) === 0) {
            if (!(await this.page.isChecked('input[type=checkbox]')))
              await this.page.click('input[type=checkbox]', { force: true });
            if (walletPage.config.COMMON.SIMPLE_CONNECT) {
              await this.page.click(
                `button[type=button] :text('${walletPage.config.COMMON.CONNECT_BUTTON_NAME}')`,
              );
            } else {
              const [connectWalletPage] = await Promise.all([
                this.page.context().waitForEvent('page', { timeout: 5000 }),
                this.page.click(
                  `button[type=button] :text('${walletPage.config.COMMON.CONNECT_BUTTON_NAME}')`,
                ),
              ]);
              await walletPage.connectWallet(connectWalletPage);
            }
            expect(
              await this.page.waitForSelector('data-testid=stakeSubmitBtn'),
            ).not.toBeNaN();
            await this.page.locator('data-testid=accountSectionHeader').click();
            expect(
              await this.page.textContent('div[data-testid="providerName"]'),
            ).toContain(walletPage.config.COMMON.CONNECTED_WALLET_NAME);
            await this.page.locator('div[role="dialog"] button').nth(0).click();
          }
        }
      },
    );
  }

  async doStaking(walletPage: WalletPage) {
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
      await this.page.fill(
        'input[type=text]',
        String(this.stakeConfig.stakeAmount),
      );
      await this.page.waitForSelector(
        'button[data-testid="stakeSubmitBtn"]:not([disabled])',
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
