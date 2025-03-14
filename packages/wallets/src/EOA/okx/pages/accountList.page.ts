import { Locator, Page, test } from '@playwright/test';

export class AccountList {
  addWalletButton: Locator;
  editWallet: Locator;
  importSelect: Locator;
  importBySeedPhraseOrPrivateKeySelect: Locator;
  confirmButton: Locator;
  // seed phrase tab
  seedPhraseTabButton: Locator;
  seedPhraseInputs: Locator;
  // private key tab
  privateKeyTabButton: Locator;
  privateKeyInput: Locator;

  constructor(public page: Page) {
    this.addWalletButton = this.page.locator('button:has-text("Add wallet")');
    this.editWallet = this.page.locator('button:has-text("Edit wallet")');
    this.importSelect = this.page.getByText('Import');
    this.importBySeedPhraseOrPrivateKeySelect = this.page.getByText(
      'Seed phrase or private key',
    );
    this.confirmButton = this.page.locator('button[type="submit"]');
    this.seedPhraseTabButton = this.page.locator(
      'div[data-e2e-okd-tabs-pane="1"]',
    );
    this.seedPhraseInputs = this.page.locator(
      'div[data-testid="okd-popup"] >> input',
    );
    this.privateKeyTabButton = this.page.locator(
      'div[data-e2e-okd-tabs-pane="2"]',
    );
    this.privateKeyInput = this.page.locator('textarea[type="password"]');
  }

  async importKey(key: string) {
    await test.step('Import wallet with key', async () => {
      await this.addWalletButton.click();
      await this.importSelect.click();
      await this.importBySeedPhraseOrPrivateKeySelect.click();
      await this.privateKeyTabButton.click();
      await this.privateKeyInput.fill(key);
      await this.confirmButton.click();
      await this.page.getByText('Select network').waitFor({ state: 'visible' });
      await this.page.getByText('Confirm').click();
      // need to wait for the setup account correct
      await this.page.waitForTimeout(2000);
    });
  }
}
