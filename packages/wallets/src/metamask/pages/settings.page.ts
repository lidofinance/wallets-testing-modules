import { Locator, Page, test } from '@playwright/test';
import { CommonWalletConfig } from '../../wallets.constants';

export class SettingsPage {
  tabBarMenu: Locator;
  experimentalTabButton: Locator;

  inputNetworksForEachSiteToggle: Locator;
  selectNetworksForEachSiteToggle: Locator;

  constructor(
    public page: Page,
    private extensionUrl: string,
    public walletConfig: CommonWalletConfig,
  ) {
    this.tabBarMenu = this.page.locator('.tab-bar');
    this.experimentalTabButton = this.tabBarMenu
      .getByRole('button')
      .getByText('Experimental');

    // Experimental page locators
    this.inputNetworksForEachSiteToggle = this.page
      .getByTestId('experimental-setting-toggle-request-queue')
      .locator('input');
    this.selectNetworksForEachSiteToggle =
      this.inputNetworksForEachSiteToggle.locator('..');
  }

  async openSettings() {
    await test.step('Open wallet setting page', async () => {
      await this.page.goto(
        this.extensionUrl +
          this.walletConfig.EXTENSION_START_PATH +
          '#settings',
      );
    });
  }
}
