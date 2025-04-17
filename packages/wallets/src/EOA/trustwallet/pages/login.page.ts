import { Locator, Page, test } from '@playwright/test';
import { AccountConfig } from '../../../wallets.constants';
import { ConsoleLogger } from '@nestjs/common';

export class LoginPage {
  logger = new ConsoleLogger(`TrustWallet. ${LoginPage.name}`);
  passwordInput: Locator;
  submitButton: Locator;

  constructor(public page: Page, public accountConfig: AccountConfig) {
    this.passwordInput = this.page.getByTestId('password-field');
    this.submitButton = this.page.locator(
      'button[data-testid="okd-button"][type="submit"]',
    );
  }

  async unlock() {
    await test.step('Unlock', async () => {
      try {
        await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
        await this.passwordInput.fill(this.accountConfig.PASSWORD);
        await this.page.locator('button:has-text("Unlock")').click();
        await this.passwordInput.waitFor({ state: 'hidden', timeout: 30000 });
      } catch {
        this.logger.log('Wallet unlocking is not needed');
      }
    });
  }
}
