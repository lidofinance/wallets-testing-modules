import { Locator, Page } from '@playwright/test';

export class WalletOperations {
  connectBtn: Locator;

  constructor(public page: Page) {
    this.connectBtn = this.page.getByTestId('connect-dapp-button');
  }
}
