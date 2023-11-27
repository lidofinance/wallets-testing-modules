import { SOLANA_WIDGET_CONFIG } from './solana.constants';
import { StakeConfig } from '../widgets.constants';
import { WidgetPage } from '../widgets.page';
import expect from 'expect';
import { Logger } from '@nestjs/common';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';
import { test, Page } from '@playwright/test';

export class SolanaPage implements WidgetPage {
  private readonly logger = new Logger(SolanaPage.name);
  page: Page;

  constructor(page: Page, private stakeConfig: StakeConfig) {
    this.page = page;
  }

  async navigate() {
    await test.step('Navigate to Solana widget', async () => {
      await this.page.goto(SOLANA_WIDGET_CONFIG.url);
    });
  }

  async connectWallet(walletPage: WalletPage) {
    await test.step(
      'Connect wallet ' + walletPage.config.COMMON.WALLET_NAME,
      async () => {
        await this.page.waitForTimeout(2000);
        const isConnected =
          (await this.page
            .locator('button:has-text("Connect wallet")')
            .count()) === 0;
        if (!isConnected) {
          await this.page
            .locator("button:has-text('Connect wallet')")
            .first()
            .click();
          await this.page.waitForTimeout(2000);
          if (
            (await this.page.locator("button :has-text('Submit')").count()) ===
            0
          ) {
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
              await this.page.waitForSelector("button:has-text('Submit')"),
            ).not.toBeNaN();
          }
        }
      },
    );
  }

  // eslint-disable-next-line
  async doStaking(walletPage: WalletPage) {}
}
