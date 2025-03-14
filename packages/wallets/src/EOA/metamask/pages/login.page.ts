import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../../wallets.constants';

export class LoginPage {
  passwordInput: Locator;
  unlockButton: Locator;

  constructor(public page: Page, public config: WalletConfig) {
    this.passwordInput = this.page.locator('id=password');
    this.unlockButton = this.page.getByText('Unlock');
  }

  async unlock() {
    await test.step('Unlock wallet', async () => {
      if (await this.passwordInput.isVisible()) {
        await this.passwordInput.fill(this.config.PASSWORD);
        await this.unlockButton.click();
        await this.page.waitForURL('**/home.html#');
      }
    });
  }
}
