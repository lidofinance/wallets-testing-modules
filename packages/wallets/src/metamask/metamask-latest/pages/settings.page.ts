import { Locator, Page, test } from '@playwright/test';
import { CommonWalletConfig } from '../../../wallets.constants';

export class SettingsPage {
  tabBarMenu: Locator;
  preferencesTabButton: Locator;

  inputExtensionInFullSizeToggle: Locator;
  selectExtensionInFullSizeToggle: Locator;

  constructor(
    public page: Page,
    private extensionUrl: string,
    public walletConfig: CommonWalletConfig,
  ) {
    this.tabBarMenu = this.page.getByTestId('settings-v2-tab-bar-grouped');
    this.preferencesTabButton = this.tabBarMenu.getByTestId(
      'settings-v2-tab-item-preferences-and-display',
    );

    // Advanced page locators
    this.inputExtensionInFullSizeToggle = this.page.getByTestId(
      'show-extension-in-full-size-view',
    );
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
      await this.preferencesTabButton.click();

      if (await this.inputExtensionInFullSizeToggle.isVisible()) {
        const toggleState =
          await this.inputExtensionInFullSizeToggle.getAttribute('value');

        if (toggleState === 'false') {
          await test.step('Turn on the toggle of the Extension in full size', async () => {
            await this.selectExtensionInFullSizeToggle.click();
            await this.page.waitForTimeout(1000); // wait for avoid mm error
          });
        }
      }
    });
  }
}
