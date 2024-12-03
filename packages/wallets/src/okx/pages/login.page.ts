import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class LoginPage {
  page: Page;
  passwordInput: Locator;
  submitButton: Locator;

  constructor(page: Page, public config: WalletConfig) {
    this.page = page;
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
        await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
        await this.passwordInput.fill(this.config.PASSWORD);
        await this.submitButton.click();
      } catch {
        console.log('The Wallet unlocking is not needed');
      }
    });
  }
}
