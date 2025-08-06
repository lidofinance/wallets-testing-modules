import { Locator, Page, test } from '@playwright/test';
import { CommonWalletConfig } from '../../../../wallets.constants';

export class AllPermissionsPage {
  tabBarMenu: Locator;
  networkRow: Locator;

  constructor(
    public page: Page,
    private extensionUrl: string,
    public walletConfig: CommonWalletConfig,
  ) {
    this.tabBarMenu = this.page.locator('.tab-bar');
    this.networkRow = this.page
      .getByTestId('site-cell-connection-list-item')
      .last();
  }
  async openAllPermissions() {
    await test.step('Open All permissions page', async () => {
      await this.page.goto(
        this.extensionUrl +
          this.walletConfig.EXTENSION_START_PATH +
          '#permissions',
      );
    });
  }

  async openEditNetworksForWebsite(url: string) {
    await test.step('Open edit networks for website', async () => {
      const domain = new URL(url).host;
      await this.page.locator(`button:has-text('${domain}')`).click();
    });
  }

  async openEditNetworksPage() {
    await test.step('Open edit networks permission page', async () => {
      await this.networkRow.getByTestId('edit').click();
    });
  }
}
