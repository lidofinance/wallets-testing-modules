import { Locator, Page, test } from '@playwright/test';

export class AccountMenu {
  accountListModal: Locator;
  addAccountOrHardwareWalletButton: Locator;
  importAccountButton: Locator;
  privateKeyInput: Locator;
  importAccountConfirmButton: Locator;
  accountListAddress: Locator;

  constructor(public page: Page) {
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
    this.accountListAddress = this.page.getByTestId('account-list-address');
  }

  async clickToAccount(accountName: string) {
    await test.step(`Click to "${accountName}" account`, async () => {
      await this.accountListModal.getByText(accountName).click();
    });
  }

  async clickToAddress(address: string) {
    await test.step(`Click to account by "${address}"`, async () => {
      const addressStart = address.slice(0, 7);
      const addressEnd = address.slice(-5);

      await this.accountListModal
        .getByText(`${addressStart}...${addressEnd}`)
        .click();
    });
  }

  async getListOfAddress() {
    return test.step('Get all exists accounts', async () => {
      const listOfAddressText = [];
      for (const address of await this.accountListAddress.all()) {
        listOfAddressText.push(await address.textContent());
      }
      return listOfAddressText;
    });
  }

  async addAccountWithKey(key: string) {
    await test.step('Import key to add account', async () => {
      await this.addAccountOrHardwareWalletButton.click();
      await this.importAccountButton.click();
      await this.privateKeyInput.fill(key);
      await this.importAccountConfirmButton.click();
    });
  }
}
