import { Locator, Page } from '@playwright/test';

export class WalletOperations {
  page: Page;
  connectBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.connectBtn = this.page.getByTestId('connect-dapp-button');
  }
}
