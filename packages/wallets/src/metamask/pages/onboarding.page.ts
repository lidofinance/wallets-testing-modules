import { Locator, Page, test } from '@playwright/test';
import { AccountConfig } from '../../wallets.constants';

export class OnboardingPage {
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

  constructor(public page: Page, public accountConfig: AccountConfig) {
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

  async firstTimeSetup() {
    await test.step('First time wallet setup', async () => {
      await this.confirmTermsOfOnboarding();
      await this.importWalletButton.click();
      await this.metricAgreeButton.click();
      await this.fillSecretPhrase(this.accountConfig.SECRET_PHRASE);
      await this.secretPhraseImportButton.click();
      await this.createPassword(this.accountConfig.PASSWORD);
      await this.completeButton.click();
      await this.pinExtensionNextButton.click();
      await this.pinExtensionDoneButton.click();
      await this.page.waitForURL('**/home.html#');
    });
  }

  async confirmTermsOfOnboarding() {
    await test.step('Confirm terms before onboarding', async () => {
      while (!(await this.page.locator('.check-box__checked').isVisible())) {
        await this.termsCheckboxButton.click();
      }
    });
  }

  async fillSecretPhrase(secretPhrase: string) {
    await test.step('Fill onboarding secret phrase field', async () => {
      const seedWords = secretPhrase.split(' ');
      for (let i = 0; i < seedWords.length; i++) {
        await this.secretPhraseInputs.nth(i).fill(seedWords[i]);
      }
    });
  }

  async createPassword(password: string) {
    await test.step('Fill onboarding password fields', async () => {
      await this.createPasswordInput.fill(password);
      await this.confirmPasswordInput.fill(password);
      await this.createPasswordTerms.click();
      await this.createPasswordImport.click();
    });
  }
}
