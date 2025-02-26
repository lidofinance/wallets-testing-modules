import { Locator, Page, test } from '@playwright/test';
import { Logger } from '@nestjs/common';
import { WalletPage } from '../../../wallets/wallet.page';

export class SetupPage {
  logger: Logger;
  saveCookiesSettingBtn: Locator;
  connectWalletBtn: Locator;
  accountCenter: Locator;
  safeAccount: Locator;
  setupUrl: string;
  closeSecurityNoticeBtn: Locator;

  constructor(
    public page: Page,
    public metamaskPage: WalletPage,
    public chainId: number,
  ) {
    this.logger = new Logger('WC+Safe wallet. Setup page');
    this.setupUrl =
      this.chainId === 1
        ? 'https://app.safe.global/welcome/accounts'
        : 'https://holesky-safe.protofire.io/welcome/accounts';

    this.saveCookiesSettingBtn = this.page.locator(
      'button:has-text("Save settings")',
    );
    this.connectWalletBtn = this.page.getByTestId('connect-wallet-btn').nth(0);
    this.accountCenter = this.page.getByTestId('open-account-center');
    this.safeAccount = this.page.getByTestId('safe-list-item').nth(0);
    this.closeSecurityNoticeBtn = this.page.getByText('I understand');
  }

  async firstTimeSetupWallet() {
    return await test.step('Safe wallet setup', async () => {
      await this.page.goto(this.setupUrl);
      await this.closeExtraPopup();
      await this.agreeCookiesSetting();
      await this.connectWalletExtension();
      try {
        await this.safeAccount.waitFor({ state: 'visible', timeout: 3000 });
      } catch {
        this.logger.error(
          "Used wallet address doesn't have any accounts in Safe",
        );
      }
      await this.safeAccount.click();
      return this.page.url();
    });
  }

  async agreeCookiesSetting() {
    await test.step('Agree cookies setting', async () => {
      try {
        await this.saveCookiesSettingBtn.waitFor({
          state: 'visible',
          timeout: 3000,
        });
        await this.saveCookiesSettingBtn.click();
      } catch {
        this.logger.log('Cookie settings are already enabled');
      }
    });
  }

  async connectWalletExtension() {
    await test.step('Connect MetaMask wallet', async () => {
      await this.connectWalletBtn.click();
      try {
        const [connectWalletPage] = await Promise.all([
          this.page.context().waitForEvent('page', { timeout: 5000 }),
          this.page
            .getByText(this.metamaskPage.config.COMMON.WALLET_NAME)
            .click(),
        ]);
        await this.metamaskPage.connectWallet(connectWalletPage);
      } catch {
        this.logger.log('Simple way wallet connection');
      }
      await this.accountCenter.waitFor({ state: 'visible', timeout: 5000 });
    });
  }

  async closeExtraPopup() {
    await test.step('Close extra popup', async () => {
      await this.closeSecurityNoticeBtn
        .waitFor({ state: 'visible', timeout: 2000 })
        .then(() => {
          this.closeSecurityNoticeBtn.click();
        })
        .catch(() => {
          this.logger.warn(
            'Security Notice is not displayed (maybe need to remove it?)',
          );
        });
    });
  }
}
