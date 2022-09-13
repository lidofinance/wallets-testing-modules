import { ETHEREUM_WIDGET_CONFIG } from './ethereum.constants';
import { StakeConfig } from '../widgets.constants';
import { WidgetPage } from '../widgets.page';
import expect from 'expect';
import { Logger } from '@nestjs/common';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';
import { test, Page } from '@playwright/test';

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

  async connectWallet(walletPage: WalletPage) {
    await test.step(
      'Connect wallet ' + walletPage.config.COMMON.WALLET_NAME,
      async () => {
        await this.page.waitForTimeout(2000);
        const popup =
          (await this.page
            .locator("button :has-text('Close and proceed')")
            .count()) > 0;
        if (popup)
          await this.page.click("button :has-text('Close and proceed')");
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
          if ((await this.page.locator('text=Submit').count()) === 0) {
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
            expect(await this.page.locator('text=Submit').count()).toBe(1);
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
      const [walletSignPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 120000 }),
        this.page.click('button[type=submit]'),
      ]);

      await walletPage.assertTxAmount(
        walletSignPage,
        String(this.stakeConfig.stakeAmount),
      );
      await walletPage.confirmTx(walletSignPage);
    });
  }
}
