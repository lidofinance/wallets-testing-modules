import { Locator, Page } from '@playwright/test';

export class OptionsMenu {
  page: Page;
  menuTooltip: Locator;
  menuSettingButton: Locator;
  menuAccountDetailsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuTooltip = this.page.getByRole('tooltip');
    this.menuSettingButton = this.menuTooltip.getByText('Settings');
    this.menuAccountDetailsButton = this.menuTooltip.getByTestId(
      'account-list-menu-details',
    );
  }
}
