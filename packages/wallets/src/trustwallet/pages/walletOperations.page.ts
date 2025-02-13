import { Locator, Page } from '@playwright/test';

export class WalletOperations {
  page: Page;
  connectBtn: Locator;
  confirmBtn: Locator;
  rejectBtn: Locator;
  viewDetailsBtn: Locator;
  txAmountValue: Locator;

  constructor(page: Page) {
    this.page = page;
    this.connectBtn = this.page.locator('button:has-text("Connect")');
    this.confirmBtn = this.page
      .getByTestId('confirm-button')
      .or(this.page.getByText('Confirm'));
    this.rejectBtn = this.rejectBtn
      .getByTestId('reject-button')
      .or(this.page.getByText('Reject'));
    this.viewDetailsBtn = this.page.getByTestId('view-details-button');
    this.txAmountValue = this.page
      .locator('p:has-text("Amount")')
      .locator('../..')
      .locator('p')
      .nth(1);
  }
}
