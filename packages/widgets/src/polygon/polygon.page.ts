import { POLYGON_WIDGET_CONFIG } from './polygon.constants';
import { StakeConfig } from '../widgets.constants';
import { WidgetPage } from '../widgets.page';
import expect from 'expect';
import { Logger } from '@nestjs/common';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';
import { test, Page } from '@playwright/test';

export class PolygonPage implements WidgetPage {
  private readonly logger = new Logger(PolygonPage.name);
  page: Page;

  constructor(page: Page, private stakeConfig: StakeConfig) {
    this.page = page;
  }

  async navigate() {
    await test.step('Navigate to Polygon widget', async () => {
      await this.page.goto(POLYGON_WIDGET_CONFIG.url);
    });
  }

  async connectWallet(walletPage: WalletPage) {
    await test.step(
      'Connect wallet' + walletPage.config.COMMON.WALLET_NAME,
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
            (await this.page
              .locator("button :has-text('Stake now')")
              .count()) === 0
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
            await this.page.waitForTimeout(1000);
            expect(
              await this.page.locator("button :has-text('Stake now')").count(),
            ).toBe(1);
          }
        }
      },
    );
  }

  async doStaking(walletPage: WalletPage) {
    await test.step('Do staking', async () => {
      await this.page.fill(
        'input[type=text]',
        String(this.stakeConfig.stakeAmount),
      );
      const [unlockSignPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 120000 }),
        this.page.click("button :has-text('Unlock tokens')"),
      ]);
      await walletPage.confirmTx(unlockSignPage);
      await this.page.waitForSelector(
        `text=${this.stakeConfig.stakeAmount} MATIC unlocked`,
        { timeout: 25000 },
      );
      // Close cross on the po-up have no usable id or locator.
      // Simple click to the non-pop-up zone will efficiently close it
      await this.page.mouse.click(20, 20);

      const [stakeSignPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 120000 }),
        this.page.click('button[type=submit]'),
      ]);

      await walletPage.confirmTx(stakeSignPage);
    });
  }
}
