import { Locator, Page, test } from '@playwright/test';
import { NetworkSetting } from './networkSetting.element';

export class Header {
  page: Page;
  networkSetting: NetworkSetting;
  accountMenuButton: Locator;
  networkListButton: Locator;
  optionsMenuButton: Locator;
  appHeaderLogo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.networkSetting = new NetworkSetting(page);
    this.accountMenuButton = this.page.getByTestId('account-menu-icon');
    this.networkListButton = this.page.getByTestId('network-display');
    this.optionsMenuButton = this.page.getByTestId(
      'account-options-menu-button',
    );
    this.appHeaderLogo = this.page.locator(
      'button[data-testid="app-header-logo"]',
    );
  }

  async getCurrentNetworkName() {
    return await test.step('Get current network', async () => {
      return await this.networkListButton.textContent();
    });
  }
}