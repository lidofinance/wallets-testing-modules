import { Locator, Page, test } from '@playwright/test';
import { CommonWalletConfig } from '../../../wallets.constants';

export class SettingsPage {
  tabBarMenu: Locator;
  advancedTabButton: Locator;
  experimentalTabButton: Locator;

  inputNetworksForEachSiteToggle: Locator;
  selectNetworksForEachSiteToggle: Locator;

  inputExtensionInFullSizeToggle: Locator;
  selectExtensionInFullSizeToggle: Locator;

  constructor(
    public page: Page,
    private extensionUrl: string,
    public walletConfig: CommonWalletConfig,
  ) {
    this.tabBarMenu = this.page.locator('.tab-bar');
    this.advancedTabButton = this.tabBarMenu
      .getByRole('button')
      .getByText('Advanced');
    this.experimentalTabButton = this.tabBarMenu
      .getByRole('button')
      .getByText('Experimental');

    // Experimental page locators
    this.inputNetworksForEachSiteToggle = this.page
      .getByTestId('experimental-setting-toggle-request-queue')
      .locator('input');
    this.selectNetworksForEachSiteToggle =
      this.inputNetworksForEachSiteToggle.locator('..');

    // Advanced page locators
    this.inputExtensionInFullSizeToggle = this.page
      .getByTestId('advanced-setting-show-extension-in-full-size-view')
      .locator('input');
    this.selectExtensionInFullSizeToggle =
      this.inputExtensionInFullSizeToggle.locator('..');
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

  async enableFullSizeView() {
    await test.step('Enable the Extension in full size view toggle', async () => {
      await this.openSettings();
      await this.advancedTabButton.click();

      if (await this.inputExtensionInFullSizeToggle.isVisible()) {
        const toggleState =
          await this.inputExtensionInFullSizeToggle.getAttribute('value');

        if (toggleState === 'false') {
          await test.step('Turn on the toggle of the Extension in full size', async () => {
            await this.selectExtensionInFullSizeToggle.click();
          });
        }
      }
    });
  }
}
