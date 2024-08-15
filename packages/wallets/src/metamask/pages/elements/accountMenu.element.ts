import { Locator, Page } from '@playwright/test';

export class AccountMenu {
  page: Page;
  accountListModal: Locator;
  addAccountOrHardwareWalletButton: Locator;
  importAccountButton: Locator;
  privateKeyInput: Locator;
  importAccountConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountListModal = this.page.locator('section[role=dialog]');
    this.addAccountOrHardwareWalletButton = this.accountListModal.getByTestId(
      'multichain-account-menu-popover-action-button',
    );
    this.importAccountButton = this.page
      .getByRole('button')
      .getByText('Import account');
    this.privateKeyInput = this.page.locator('id=private-key-box');
    this.importAccountConfirmButton = this.page.getByTestId(
      'import-account-confirm-button',
    );
  }

  async clickToAddress(addressName: string) {
    await this.accountListModal.getByText(addressName).click();
  }
}
