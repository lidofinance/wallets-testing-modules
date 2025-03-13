import { Locator, Page } from '@playwright/test';

export class OptionsMenu {
  menuTooltip: Locator;
  menuSettingButton: Locator;
  menuAccountDetailsButton: Locator;

  constructor(public page: Page) {
    this.menuTooltip = this.page.getByRole('tooltip');
    this.menuSettingButton = this.menuTooltip.getByText('Settings');
    this.menuAccountDetailsButton = this.menuTooltip.getByTestId(
      'account-list-menu-details',
    );
  }
}
