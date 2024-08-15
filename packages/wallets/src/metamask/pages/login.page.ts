import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class LoginPage {
  page: Page;
  passwordInput: Locator;
  unlockButton: Locator;

  constructor(page: Page, public config: WalletConfig) {
    this.page = page;
    this.passwordInput = this.page.locator('id=password');
    this.unlockButton = this.page.getByText('Unlock');
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.passwordInput.count()) > 0) {
        await this.passwordInput.fill(this.config.PASSWORD);
        await this.unlockButton.click();
        await this.page.waitForURL('**/home.html#');
      }
    });
  }
}
