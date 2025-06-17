import { Locator, Page, test } from '@playwright/test';
import { WalletPage } from '../../wallet.page';
import { WalletConnectTypes } from '../../wallets.constants';
import { ConsoleLogger } from '@nestjs/common';

export class SetupPage {
  logger = new ConsoleLogger(`Safe. ${SetupPage.name}`);
  saveCookiesSettingBtn: Locator;
  connectWalletBtn: Locator;
  accountCenter: Locator;
  safeAccount: Locator;
  setupUrl: string;
  closeSecurityNoticeBtn: Locator;
  inAppContinueBtn: Locator;

  constructor(
    public page: Page,
    public extensionPage: WalletPage<WalletConnectTypes.EOA>,
    public chainId: number,
  ) {
    this.setupUrl =
      this.chainId === 1
        ? 'https://app.safe.global/welcome/accounts'
        : 'https://app.safe.protofire.io/welcome/accounts'; //Hoodi
    this.saveCookiesSettingBtn = this.page.locator(
      'button:has-text("Accept all")',
    );
    this.connectWalletBtn = this.page.getByTestId('connect-wallet-btn').nth(0);
    this.accountCenter = this.page.getByTestId('open-account-center');
    this.safeAccount = this.page
      .locator(
        `[data-testId=safe-list-item]:has(img[alt='${
          this.chainId === 1 ? 'Ethereum' : 'Hoodi Testnet'
        } Logo'])`,
      )
      .nth(0);
    this.closeSecurityNoticeBtn = this.page.getByText('I understand');
    this.inAppContinueBtn = this.page.getByText('Continue');
  }

  async firstTimeSetupWallet() {
    return await test.step('Safe wallet setup', async () => {
      await this.page.goto(this.setupUrl);
      await this.connectWalletExtension();
      try {
        await this.safeAccount.waitFor({ state: 'visible', timeout: 5000 });
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
      await this.closeExtraPopup();
      await this.agreeCookiesSetting();
      await this.page.waitForTimeout(2000);
      try {
        await this.accountCenter.waitFor({ state: 'visible', timeout: 5000 });
        this.logger.log('Extension is auto-connected');
        return;
      } catch {
        // extension not connected - continue the flow
      }
      await this.connectWalletBtn.click();
      try {
        await this.page
          .getByText(
            this.extensionPage.options.walletConfig.EXTENSION_WALLET_NAME,
          )
          .waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        try {
          await this.accountCenter.waitFor({ state: 'visible', timeout: 5000 });
          return;
        } catch {
          this.logger.log('Second try to connect wallet...');
        }
        await this.page.reload();
        await this.closeExtraPopup();
        await this.connectWalletBtn.click();
      }
      try {
        const [connectWalletPage] = await Promise.all([
          this.page.context().waitForEvent('page', { timeout: 5000 }),
          this.page
            .getByText(
              this.extensionPage.options.walletConfig.EXTENSION_WALLET_NAME,
            )
            .click(),
        ]);
        await this.extensionPage.connectWallet(connectWalletPage);
      } catch (er) {
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
