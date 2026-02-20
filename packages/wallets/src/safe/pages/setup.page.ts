import { Locator, Page, test } from '@playwright/test';
import { WalletPage } from '../../wallet.page';
import { ConsoleLogger } from '@nestjs/common';

export class SetupPage {
  logger = new ConsoleLogger(`Safe. ${SetupPage.name}`);
  saveCookiesSettingBtn: Locator;
  connectWalletBtn: Locator;
  accountCenter: Locator;
  safeAccount: Locator;
  addSafesBtn: Locator;
  manageTrustedSafesBtn: Locator;
  setupUrl: string;
  closeSecurityNoticeBtn: Locator;
  inAppContinueBtn: Locator;
  beamerAnnouncementBar: Locator;

  constructor(
    public page: Page,
    public extensionPage: WalletPage,
    public chainId: number,
  ) {
    this.setupUrl =
      this.chainId === 1
        ? 'https://app.safe.global/welcome/accounts'
        : 'https://app.safe.protofire.io/welcome/accounts'; //Hoodi
    this.saveCookiesSettingBtn = this.page.locator(
      'button:has-text("Save settings")',
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
    this.addSafesBtn = this.page.getByTestId('select-safes-button');
    this.manageTrustedSafesBtn = this.page.getByTestId('add-more-safes-button');
    this.closeSecurityNoticeBtn = this.page.getByText('I understand');
    this.inAppContinueBtn = this.page.getByText('Continue');

    this.beamerAnnouncementBar = this.page.locator('#beamerAnnouncementBar');
  }

  async firstTimeSetupWallet() {
    return await test.step('First time Safe wallet setup', async () => {
      await this.page.goto(this.setupUrl);

      try {
        // will remove this in the future, when the Safe Labs page stops displaying before tests
        await test.step('Accept terms of Safe Labs', async () => {
          await this.page
            .getByText(
              'Starting October 15, 2025, Safe Labs GmbH ("Safe Labs" or "we") will offer the interface to your multi-signature wallet',
            )
            .waitFor({ state: 'visible', timeout: 2000 });
          for (const checkbox of await this.page.getByRole('checkbox').all()) {
            await checkbox.check();
          }
          await this.page
            .locator('button:has-text("Accept terms & Continue")')
            .click();
        });
      } catch {
        // continue setup wallet
        this.logger.warn(
          'The Safe Labs page is not displayed. Maybe need to remove? (check prod, please)',
        );
      }

      await this.connectWalletExtension();

      await test.step('Add trusted Safes', async () => {
        try {
          // If the button is visible, the trusted Safe is selected
          if (this.chainId === 1)
            await this.manageTrustedSafesBtn.waitFor({
              state: 'visible',
              timeout: 3000,
            });
        } catch {
          await this.addSafesBtn.click();

          try {
            await this.safeAccount.waitFor({
              state: 'visible',
              timeout: 15000,
            });
          } catch {
            this.logger.warn(
              "Used wallet address doesn't have any accounts in Safe",
            );
          }

          await this.safeAccount.click();
          await this.page
            .locator('h2:has-text("Manage trusted Safes")')
            .locator('..')
            .locator('button:has-text("Save")')
            .click();
        }
      });

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
      await this.agreeCookiesSetting();
      await this.page.waitForTimeout(2000);
      await this.closeBeamerAnnouncementBanner();

      if (await this.waitForVisible(this.accountCenter, 5000)) {
        this.logger.log('Extension is auto-connected');
        return;
      }

      const attempts = 3; // to connect wallet
      for (let attempt = 1; attempt <= attempts; attempt++) {
        await this.connectWalletBtn.click();

        if (
          await this.waitForVisible(
            this.page.getByText(
              this.extensionPage.options.walletConfig.EXTENSION_WALLET_NAME,
            ),
            5000,
          )
        ) {
          break;
        }
        this.logger.log(`[Attempt ${attempt}] Connect wallet to Safe failed`);
        await this.page.reload();
      }

      try {
        await this.page
          .getByText(
            this.extensionPage.options.walletConfig.EXTENSION_WALLET_NAME,
          )
          .click();
        await this.extensionPage.connectWallet();
      } catch (er) {
        // Expect the wallet is connected
      }
      await this.accountCenter.waitFor({ state: 'visible', timeout: 5000 });
    });
  }

  async closeBeamerAnnouncementBanner() {
    await test.step('Close announcement banner (if visible)', async () => {
      if (await this.waitForVisible(this.beamerAnnouncementBar, 3000)) {
        await this.beamerAnnouncementBar.locator('svg').click();
      }
    });
  }

  async waitForVisible(locator: Locator, timeout: number) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }
}
