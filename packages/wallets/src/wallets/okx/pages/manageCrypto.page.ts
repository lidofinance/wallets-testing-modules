import { Locator, Page, test } from '@playwright/test';

export class ManageCryptoPage {
  page: Page;
  customCryptoButton: Locator;
  tokenAddressInput: Locator;
  confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.customCryptoButton = this.page.locator(
      'button:has-text("Custom crypto")',
    );
    this.tokenAddressInput = this.page.locator(
      'textarea[data-testid="okd-input"]',
    );
    this.confirmButton = this.page.locator('button:has-text("Confirm")');
  }

  async importToken(token: string) {
    await test.step(`Import token "${token}"`, async () => {
      await this.customCryptoButton.click();
      await this.tokenAddressInput.fill(token);
      while (!(await this.confirmButton.isEnabled())) {
        // wait while button to be enabled
        await this.page.waitForTimeout(1000);
      }
      await this.confirmButton.click();
    });
  }
}
