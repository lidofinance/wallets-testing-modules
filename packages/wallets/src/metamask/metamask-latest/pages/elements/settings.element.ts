import { Locator, Page, test } from '@playwright/test';

export class SettingsElement {
  settingsMenu: Locator;
  menuTooltip: Locator;
  menuSettingButton: Locator;
  accountDetailsButton: Locator;
  networksButton: Locator;

  constructor(public page: Page) {
    this.settingsMenu = this.page.getByTestId('account-options-menu-button');
    this.menuTooltip = this.page.getByRole('tooltip');
    this.menuSettingButton = this.menuTooltip.getByText('Settings');
    this.accountDetailsButton = this.menuTooltip.getByTestId(
      'account-list-menu-details',
    );
    this.networksButton = this.menuTooltip.getByTestId('global-menu-networks');
  }

  async open() {
    await test.step('Open settings menu', async () => {
      await this.settingsMenu.click({ force: true });
    });
  }

  async openSettings() {
    await test.step('Open settings', async () => {
      await this.menuSettingButton.click();
    });
  }

  async openNetworksSettings() {
    await test.step('Open networks list', async () => {
      await this.open();
      await this.networksButton.click();
    });
  }

  async openAccountSettings() {
    await test.step('Open account settings', async () => {
      await this.open();
      await this.accountDetailsButton.click();
    });
  }
}
