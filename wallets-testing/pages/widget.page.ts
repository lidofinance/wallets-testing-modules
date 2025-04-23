import { Locator, Page } from '@playwright/test';

export class WidgetPage {
  connectBtn: Locator;
  stakeInput: Locator;
  stakeSubmitBtn: Locator;
  enabledStakeSubmitBtn: Locator;

  headerAccountSection: Locator;
  providerName: Locator;
  ethAvailableToStakeValue: Locator;
  termsCheckbox: Locator;
  copyWcUrlBtn: Locator;

  constructor(public page: Page) {
    this.connectBtn = this.page.getByTestId('connectBtn');
    this.stakeInput = this.page.getByTestId('stakeInput');
    this.stakeSubmitBtn = this.page.getByTestId('stakeSubmitBtn');
    this.enabledStakeSubmitBtn = this.page.locator(
      'button[data-testid="stakeSubmitBtn"]:not([disabled])',
    );
    this.headerAccountSection = this.page.getByTestId('accountSectionHeader');
    this.providerName = this.page.locator('div[data-testid="providerName"]');
    this.ethAvailableToStakeValue = this.page.getByTestId(
      'ethAvailableToStake',
    );
    this.termsCheckbox = this.page.locator('input[type=checkbox]');
    this.copyWcUrlBtn = this.page.locator('.wcm-action-btn');
  }

  async goto(path?: string) {
    await this.page.goto(path);
  }

  async getWalletButtonByName(walletButtonName: string) {
    return this.page.getByRole('button').getByText(walletButtonName, {
      exact: true,
    });
  }

  async waitForPage(timeout?: number) {
    return this.page.context().waitForEvent('page', { timeout: timeout });
  }

  async closeAccountModal() {
    await this.page.locator('div[role="dialog"] button').nth(0).click();
  }
}
