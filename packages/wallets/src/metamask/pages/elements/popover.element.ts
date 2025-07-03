import { Locator, Page, test } from '@playwright/test';

export class PopoverElements {
  popoverCloseButton: Locator;
  manageInSettingButton: Locator;
  notRightNowButton: Locator;
  gotItButton: Locator;
  noThanksButton: Locator;
  switchToButton: Locator;
  accountDetailAddressLabel: Locator;
  solanaPopupCloseBtn: Locator;

  connectingToMainnetPopover: Locator;
  connectingProblemPopover: Locator;
  connectingProblemCloseButton: Locator;

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

    // Connecting Problem Popover
    this.connectingToMainnetPopover = this.page.getByText(
      'Connecting to Ethereum Mainnet',
    );
    this.connectingProblemPopover = this.page.getByText(
      'We can’t connect to Ethereum Mainnet',
    );
    this.connectingProblemCloseButton = this.page.locator(
      '#page-container__header-close',
    );
  }

  async closeConnectingProblemPopover(attempts = 5) {
    await test.step('Close connecting problem popover', async () => {
      for (let i = 0; i < attempts; i++) {
        const isVisible =
          (await this.connectingToMainnetPopover.isVisible()) ||
          (await this.connectingProblemPopover.isVisible());

        if (!isVisible) return;

        await this.connectingProblemCloseButton.click();
        await this.page.waitForTimeout(100);
      }
    });
  }

  async closePopover() {
    await test.step('Close popover if it exists', async () => {
      if (!this.page) throw "Page isn't ready";

      if (await this.solanaPopupCloseBtn.isVisible())
        await this.solanaPopupCloseBtn.click();

      if (await this.isPopoverVisible()) await this.popoverCloseButton.click();

      if (await this.manageInSettingButton.isVisible())
        await this.manageInSettingButton.click();

      if (await this.notRightNowButton.isVisible())
        await this.notRightNowButton.click();

      if (await this.gotItButton.first().isVisible())
        await this.gotItButton.first().click();

      if (await this.noThanksButton.isVisible())
        await this.noThanksButton.click();
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
