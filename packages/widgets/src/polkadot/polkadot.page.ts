import { WidgetPage } from '../widgets.page';
import { Logger } from '@nestjs/common';
import { Page, test } from '@playwright/test';
import { StakeConfig } from '../widgets.constants';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';
import { POLKADOT_WIDGET_CONFIG } from './polkadot.constants';
import expect from 'expect';

export class PolkadotPage implements WidgetPage {
  private readonly logger = new Logger(PolkadotPage.name);
  page: Page;

  constructor(page: Page, private stakeConfig: StakeConfig) {
    this.page = page;
  }

  async navigate(): Promise<void> {
    await test.step('Navigate to Kusama widget', async () => {
      await this.page.goto(POLKADOT_WIDGET_CONFIG.url);
    });
  }

  async connectWallet(walletPage: WalletPage): Promise<void> {
    await test.step(
      'Connect wallet ' + walletPage.config.COMMON.WALLET_NAME,
      async () => {
        await this.page.waitForTimeout(2000);
        const isConnected =
          (await this.page
            .locator("button :has-text('Connect wallet')")
            .count()) === 0;
        if (!isConnected) {
          await this.page
            .locator("button :has-text('Connect wallet')")
            .first()
            .click();
          await this.page.waitForTimeout(2000);
          if (
            (await this.page.locator("button :has-text('Stake')").count()) === 0
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
              await this.page.waitForSelector("button :has-text('Stake')"),
            ).not.toBeNaN();
          }
        }
      },
    );
  }

  // eslint-disable-next-line
    async doStaking(walletPage: WalletPage): Promise<void> {}
}
