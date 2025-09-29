import { Locator, Page } from '@playwright/test';

export class Header {
  accountMenuButton: Locator;
  appHeaderLogo: Locator;

  constructor(public page: Page) {
    this.accountMenuButton = this.page.getByTestId('account-menu-icon');
    this.appHeaderLogo = this.page.locator(
      'button[data-testid="app-header-logo"]',
    );
  }
}
