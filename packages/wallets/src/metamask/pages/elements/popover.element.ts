import { Locator, Page } from '@playwright/test';

export class PopoverElements {
  page: Page;
  popoverCloseButton: Locator;
  manageInSettingButton: Locator;
  notRightNowButton: Locator;
  gotItButton: Locator;
  noThanksButton: Locator;
  switchToButton: Locator;
  accountDetailCopyAddressButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.popoverCloseButton = this.page.getByTestId('popover-close');
    this.manageInSettingButton = this.page.locator(
      'button:has-text("Manage in settings")',
    );
    this.notRightNowButton = this.page.getByText('Not right now');
    this.noThanksButton = this.page.getByText('No thanks');
    this.gotItButton = this.page.getByText('Got it');
    this.switchToButton = this.page.getByText('Switch to ');
    this.accountDetailCopyAddressButton = this.page.getByTestId(
      'address-copy-button-text',
    );
  }

  async isPopoverVisible() {
    try {
      await this.popoverCloseButton.waitFor({
        state: 'visible',
        timeout: 1000,
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
