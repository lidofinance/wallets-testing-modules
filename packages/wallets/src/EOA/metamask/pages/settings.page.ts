import { Locator, Page, test } from '@playwright/test';
import { CommonWalletConfig } from '../../../wallets.constants';

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

  async setupNetworkChangingSetting() {
    await test.step('Check toggle state', async () => {
      await this.openSettings();
      await this.experimentalTabButton.click();

      if (await this.inputNetworksForEachSiteToggle.isVisible()) {
        const toggleState =
          await this.inputNetworksForEachSiteToggle.getAttribute('value');

        if (toggleState === 'true') {
          await test.step('Turn off the toggle of the setting network changing', async () => {
            await this.selectNetworksForEachSiteToggle.click();
          });
        }
      }
    });
  }
}
