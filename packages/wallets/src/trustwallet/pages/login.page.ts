import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class LoginPage {
  page: Page;
  passwordInput: Locator;
  submitButton: Locator;

  constructor(page: Page, public config: WalletConfig) {
    this.page = page;
    this.passwordInput = this.page.getByTestId('password-field');
    this.submitButton = this.page.locator(
      'button[data-testid="okd-button"][type="submit"]',
    );
  }

  async unlock() {
    await test.step('Unlock', async () => {
      try {
        await this.passwordInput.waitFor({ state: 'visible', timeout: 2000 });
        await this.passwordInput.fill(this.config.PASSWORD);
        await this.page.locator('button:has-text("Unlock")').click();
      } catch {
        console.log('Wallet unlocking is not needed');
      }
    });
  }
}
