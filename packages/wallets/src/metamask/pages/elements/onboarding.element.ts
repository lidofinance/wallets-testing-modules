import { Locator, Page } from '@playwright/test';

export class OnboardingElement {
  page: Page;
  termsCheckboxButton: Locator;
  importWalletButton: Locator;
  metricAgreeButton: Locator;
  secretPhraseInputs: Locator;
  secretPhraseImportButton: Locator;
  createPasswordInput: Locator;
  confirmPasswordInput: Locator;
  createPasswordTerms: Locator;
  createPasswordImport: Locator;
  completeButton: Locator;
  pinExtensionNextButton: Locator;
  pinExtensionDoneButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.termsCheckboxButton = this.page.getByTestId(
      'onboarding-terms-checkbox',
    );
    this.importWalletButton = this.page.getByTestId('onboarding-import-wallet');
    this.metricAgreeButton = this.page.getByTestId('metametrics-i-agree');
    this.secretPhraseInputs = this.page.locator(
      '.import-srp__srp-word >> input[type=password]',
    );
    this.secretPhraseImportButton = this.page.getByTestId('import-srp-confirm');
    this.createPasswordInput = this.page.getByTestId('create-password-new');
    this.confirmPasswordInput = this.page.getByTestId(
      'create-password-confirm',
    );
    this.createPasswordTerms = this.page.getByTestId('create-password-terms');
    this.createPasswordImport = this.page.getByTestId('create-password-import');
    this.completeButton = this.page.getByTestId('onboarding-complete-done');
    this.pinExtensionNextButton = this.page.getByTestId('pin-extension-next');
    this.pinExtensionDoneButton = this.page.getByTestId('pin-extension-done');
  }

  async confirmTermsOfOnboarding() {
    while (!(await this.page.locator('.check-box__checked').isVisible())) {
      console.log('Checkbox is not checked');
      await this.termsCheckboxButton.click();
    }
  }

  async fillSecretPhrase(secretPhrase: string) {
    const seedWords = secretPhrase.split(' ');
    for (let i = 0; i < seedWords.length; i++) {
      await this.secretPhraseInputs.nth(i).fill(seedWords[i]);
    }
  }

  async createPassword(password: string) {
    await this.createPasswordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.createPasswordTerms.click();
    await this.createPasswordImport.click();
  }
}
