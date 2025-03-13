import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../../wallets.constants';
import { ConsoleLogger } from '@nestjs/common';

export class LoginPage {
  logger = new ConsoleLogger(`Ctrl. ${LoginPage.name}`);
  unlockBtn: Locator;
  passwordInput: Locator;
  homeBtn: Locator;

  constructor(public page: Page, public config: WalletConfig) {
    this.unlockBtn = this.page.getByTestId('unlock-btn');
    this.passwordInput = this.page.locator('input[type="password"]');
  }

  async unlock() {
    await test.step('Unlock wallet', async () => {
      try {
        await this.unlockBtn.waitFor({ state: 'visible', timeout: 2000 });
        await this.passwordInput.fill(this.config.PASSWORD);
        await this.unlockBtn.click();
        await this.homeBtn.waitFor({ state: 'visible' });
      } catch {
        this.logger.log('The Wallet unlocking is not needed');
      }
    });
  }
}
