import { Locator, Page, test } from '@playwright/test';
import { AccountConfig } from '../../../wallets.constants';

export class LoginPage {
  passwordInput: Locator;
  unlockButton: Locator;
  loaderSpinner: Locator;

  constructor(public page: Page, public accountConfig: AccountConfig) {
    this.passwordInput = this.page.locator('id=password');
    this.unlockButton = this.page.getByText('Unlock');
    this.loaderSpinner = this.page.locator('.loading-spinner');
  }

  async unlock() {
    await test.step('Unlock wallet', async () => {
      try {
        await this.loaderSpinner.waitFor({ state: 'visible', timeout: 2000 });
        await this.loaderSpinner.waitFor({ state: 'hidden', timeout: 30000 });
      } catch {
        // continue after loader is hidden
      }

      if (await this.passwordInput.isVisible()) {
        await this.passwordInput.fill(this.accountConfig.PASSWORD);
        await this.unlockButton.click();
        await this.page.waitForURL('**/home.html#/');
      }
    });
  }
}
