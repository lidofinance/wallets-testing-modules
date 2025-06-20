import { Locator, Page, test } from '@playwright/test';
import { AccountConfig } from '../../wallets.constants';
import { ConsoleLogger } from '@nestjs/common';

export class LoginPage {
  logger = new ConsoleLogger(`OKX. ${LoginPage.name}`);
  passwordInput: Locator;
  submitButton: Locator;

  constructor(public page: Page, public accountConfig: AccountConfig) {
    this.passwordInput = this.page.locator(
      'input[data-testid="okd-input"][type="password"]',
    );
    this.submitButton = this.page.locator(
      'button[data-testid="okd-button"][type="submit"]',
    );
  }

  async unlock() {
    await test.step('Unlock wallet', async () => {
      try {
        await this.passwordInput.waitFor({ state: 'visible', timeout: 2000 });
        await this.passwordInput.fill(this.accountConfig.PASSWORD);
        await this.submitButton.click();
        await this.submitButton.waitFor({ state: 'hidden' });
      } catch {
        this.logger.log('The Wallet unlocking is not needed');
      }
    });
  }
}
