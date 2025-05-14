import { Locator, Page, test } from '@playwright/test';
import { AccountConfig } from '../../../wallets.constants';

export class OnboardingPage {
  iHaveWalletBtn: Locator;
  restoreWalletBtn: Locator;
  walletPassword: Locator;
  repeatWalletPassword: Locator;
  nextButton: Locator;
  finishOnboardingBtn: Locator;

  constructor(public page: Page, public accountConfig: AccountConfig) {
    this.iHaveWalletBtn = this.page.getByTestId(
      'exodusmovement.exodus:id/button-already-have-a-wallet',
    );
    this.restoreWalletBtn = this.page.getByTestId(
      'exodusmovement.exodus:id/button-restore',
    );
    this.walletPassword = this.page.getByTestId(
      'exodusmovement.exodus:id/field-new-password',
    );
    this.repeatWalletPassword = this.page.getByTestId(
      'exodusmovement.exodus:id/input-type-password-again',
    );
    this.nextButton = this.page.getByTestId(
      'exodusmovement.exodus:id/button-next',
    );
    this.finishOnboardingBtn = this.page.getByTestId(
      'exodusmovement.exodus:id/button-get-started',
    );
  }

  async firstTimeSetup() {
    if ((await this.iHaveWalletBtn.count()) === 0) return;

    await test.step('First time setup', async () => {
      await this.iHaveWalletBtn.click();

      await test.step('Fill the seed phrase', async () => {
        await this.page.fill(
          'input[type="text"]',
          this.accountConfig.SECRET_PHRASE,
        );
        await this.restoreWalletBtn.click();
      });

      await test.step('Setup wallet password', async () => {
        await this.walletPassword.fill(this.accountConfig.PASSWORD);
        await this.nextButton.click();
        await this.repeatWalletPassword.fill(this.accountConfig.PASSWORD);
        await this.nextButton.click();
      });

      await this.finishOnboardingBtn.waitFor({
        state: 'visible',
        timeout: 30000,
      });
    });
  }
}
