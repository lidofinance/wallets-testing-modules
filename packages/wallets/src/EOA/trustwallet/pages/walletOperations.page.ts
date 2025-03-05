import { Locator, Page } from '@playwright/test';
import { Logger } from '@nestjs/common';

export class WalletOperations {
  logger = new Logger('Trust wallet. WalletOperations');
  connectBtn: Locator;
  confirmBtn: Locator;
  rejectBtn: Locator;
  viewDetailsBtn: Locator;
  txAmountValue: Locator;
  proceedAnywayBtn: Locator;
  continueAnywayBtn: Locator;
  checkbox: Locator;

  constructor(public page: Page) {
    this.connectBtn = this.page.locator('button:has-text("Connect")');
    this.confirmBtn = this.page
      .getByTestId('confirm-button')
      .or(this.page.getByText('Confirm'))
      .nth(0);
    this.rejectBtn = this.page
      .getByTestId('reject-button')
      .or(this.page.getByText('Reject'))
      .nth(0);
    this.viewDetailsBtn = this.page.getByTestId('view-details-button');
    this.txAmountValue = this.page
      .locator('p:has-text("Amount")')
      .locator('../..')
      .locator('p')
      .nth(1);
    this.proceedAnywayBtn = this.page.locator(
      'button:has-text("Proceed anyway")',
    );
    this.continueAnywayBtn = this.page.locator(
      'button:has-text("Continue anyway")',
    );
    this.checkbox = this.page.locator('[type="checkbox"]');
  }

  async confirmHighRisk() {
    try {
      await this.page
        .getByText('This URL is marked as high risk')
        .waitFor({ state: 'visible', timeout: 2000 });
      await this.proceedAnywayBtn.click();
      await this.checkbox.nth(0).check(); // I understand I can lose all my tokens
      await this.checkbox.nth(1).check(); // I understand my lost tokens cannot be recovered by Trust
      await this.continueAnywayBtn.click();
      this.logger.error('High risk notify before wallet connection');
    } catch {
      return;
    }
  }
}
