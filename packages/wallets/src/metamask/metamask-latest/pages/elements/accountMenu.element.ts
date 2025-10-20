import { Locator, Page, test } from '@playwright/test';

export class AccountMenu {
  accountListModal: Locator;
  addAccountButton: Locator;
  importAccountButton: Locator;
  privateKeyInput: Locator;
  importAccountConfirmButton: Locator;
  accountListAddress: Locator;
  backButton: Locator;
  importError: Locator;

  constructor(public page: Page) {
    this.accountListModal = this.page.getByTestId('multichain-page');
    this.addAccountButton = this.accountListModal.getByTestId(
      'account-list-add-wallet-button',
    );
    this.importAccountButton = this.page.getByTestId(
      'add-wallet-modal-import-account',
    );
    this.privateKeyInput = this.page.locator('id=private-key-box');
    this.importAccountConfirmButton = this.page.getByTestId(
      'import-account-confirm-button',
    );
    this.accountListAddress = this.page.getByTestId('account-list-address');
    this.backButton = this.page.getByLabel('Back');
    this.importError = this.page.getByText(
      'KeyringController - The account you are trying to import is a duplicate',
    );
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
      await this.addAccountButton.click();
      await this.importAccountButton.click();
      await this.privateKeyInput.fill(key);
      await this.importAccountConfirmButton.click();

      if (await this.importError.isVisible()) await this.backButton.click();
      await this.backButton.click();
    });
  }
}
