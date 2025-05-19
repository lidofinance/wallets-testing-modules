import { Locator, Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';

export class PopoverElements {
  logger = new ConsoleLogger('Metamask. ' + PopoverElements.name);
  popoverCloseButton: Locator;
  manageInSettingButton: Locator;
  notRightNowButton: Locator;
  gotItButton: Locator;
  noThanksButton: Locator;
  switchToButton: Locator;
  accountDetailAddressLabel: Locator;
  solanaPopupCloseBtn: Locator;

  constructor(public page: Page) {
    this.popoverCloseButton = this.page.getByTestId('popover-close');
    this.manageInSettingButton = this.page.locator(
      'button:has-text("Manage in settings")',
    );
    this.notRightNowButton = this.page.getByText('Not right now');
    this.noThanksButton = this.page.getByText('No thanks');
    this.gotItButton = this.page.getByText('Got it');
    this.switchToButton = this.page.getByText('Switch to ');
    this.accountDetailAddressLabel = this.page.locator(
      '//div[@data-testid="address-copy-button-text"]/preceding-sibling::p',
    );
    this.solanaPopupCloseBtn = this.page.getByText('Not now');
  }

  async closePopover() {
    await test.step('Close popover if it exists', async () => {
      if (!this.page) throw "Page isn't ready";

      if (await this.solanaPopupCloseBtn.isVisible())
        await this.solanaPopupCloseBtn.click({ timeout: 3000 });

      if (await this.isPopoverVisible())
        await this.popoverCloseButton.click({ timeout: 3000 });

      if (await this.manageInSettingButton.isVisible())
        await this.manageInSettingButton.click({ timeout: 3000 });

      if (await this.notRightNowButton.isVisible())
        await this.notRightNowButton.click({ timeout: 3000 });

      if (await this.gotItButton.first().isVisible())
        await this.gotItButton.first().click({ timeout: 3000 });

      if (await this.noThanksButton.isVisible())
        await this.noThanksButton.click({ timeout: 3000 });
    });
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
