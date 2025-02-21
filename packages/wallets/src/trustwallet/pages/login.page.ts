import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class LoginPage {
  passwordInput: Locator;
  submitButton: Locator;

  constructor(public page: Page, public config: WalletConfig) {
    this.passwordInput = this.page.getByTestId('password-field');
    this.submitButton = this.page.locator(
      'button[data-testid="okd-button"][type="submit"]',
    );
  }

  async unlock() {
    await test.step('Unlock', async () => {
      try {
        await this.passwordInput.waitFor({ state: 'visible', timeout: 5000 });
        await this.passwordInput.fill(this.config.PASSWORD);
        await this.page.locator('button:has-text("Unlock")').click();
        await this.passwordInput.waitFor({ state: 'hidden', timeout: 30000 });
      } catch {
        console.log('[INFO] Wallet unlocking is not needed');
      }
    });
  }
}
