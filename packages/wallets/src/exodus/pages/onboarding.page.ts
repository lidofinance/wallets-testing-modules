import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class OnboardingPage {
  page: Page;
  iHaveWalletBtn: Locator;
  restoreWalletBtn: Locator;
  walletPassword: Locator;
  repeatWalletPassword: Locator;
  nextButton: Locator;
  finishOnboardingBtn: Locator;

  constructor(page: Page, public config: WalletConfig) {
    this.page = page;
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
        await this.page.fill('input[type="text"]', this.config.SECRET_PHRASE);
        await this.restoreWalletBtn.click();
      });

      await test.step('Setup wallet password', async () => {
        await this.walletPassword.fill(this.config.PASSWORD);
        await this.nextButton.click();
        await this.repeatWalletPassword.fill(this.config.PASSWORD);
        await this.nextButton.click();
      });

      await this.finishOnboardingBtn.waitFor({
        state: 'visible',
        timeout: 30000,
      });
    });
  }
}
