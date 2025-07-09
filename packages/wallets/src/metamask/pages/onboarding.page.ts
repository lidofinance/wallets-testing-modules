import { Locator, Page, test } from '@playwright/test';
import { AccountConfig } from '../../wallets.constants';

export class OnboardingPage {
  getStartedButton: Locator;
  termsOfUseScrollButton: Locator;
  termsCheckboxButton: Locator;
  termsOfUseAgreeButton: Locator;
  importWalletButton: Locator;
  metricAgreeButton: Locator;
  secretPhraseTextArea: Locator;
  secretPhraseImportButton: Locator;
  createPasswordInput: Locator;
  confirmPasswordInput: Locator;
  createPasswordTerms: Locator;
  createPasswordSubmit: Locator;
  completeButton: Locator;
  pinExtensionDoneButton: Locator;

  constructor(public page: Page, public accountConfig: AccountConfig) {
    this.getStartedButton = this.page.getByTestId(
      'onboarding-get-started-button',
    );
    this.termsOfUseScrollButton = this.page.getByTestId(
      'terms-of-use-scroll-button',
    );
    this.termsOfUseAgreeButton = this.page.getByTestId(
      'terms-of-use-agree-button',
    );
    this.termsCheckboxButton = this.page.locator('#terms-of-use__checkbox');

    this.importWalletButton = this.page.getByTestId('onboarding-import-wallet');
    this.metricAgreeButton = this.page.getByTestId('metametrics-i-agree');
    this.secretPhraseTextArea = this.page.getByTestId(
      'srp-input-import__srp-note',
    );
    this.secretPhraseImportButton = this.page.getByTestId('import-srp-confirm');
    this.createPasswordInput = this.page.getByTestId(
      'create-password-new-input',
    );
    this.confirmPasswordInput = this.page.getByTestId(
      'create-password-confirm-input',
    );
    this.createPasswordTerms = this.page.getByTestId('create-password-terms');
    this.createPasswordSubmit = this.page.getByTestId('create-password-submit');
    this.completeButton = this.page.getByTestId('onboarding-complete-done');
    this.pinExtensionDoneButton = this.page.getByTestId('pin-extension-done');
  }

  async firstTimeSetup() {
    await test.step('First time wallet setup', async () => {
      await this.getStartedButton.click();
      await this.confirmTermsOfOnboarding();
      await this.importWalletButton.click();
      await this.fillSecretPhrase(this.accountConfig.SECRET_PHRASE);
      await this.secretPhraseImportButton.click();
      await this.createPassword(this.accountConfig.PASSWORD);
      await this.metricAgreeButton.click();
      await this.completeButton.click();
      await this.pinExtensionDoneButton.click();
      await this.page.waitForURL('**/home.html#unlock');
    });
  }

  async confirmTermsOfOnboarding() {
    await test.step('Confirm terms before onboarding', async () => {
      await this.termsOfUseScrollButton.click();
      while (
        !(await this.page.locator('.mm-checkbox__input--checked').isVisible())
      ) {
        await this.termsCheckboxButton.click();
      }
      await this.termsOfUseAgreeButton.click();
    });
  }

  async fillSecretPhrase(secretPhrase: string) {
    await test.step('Fill onboarding secret phrase field', async () => {
      await this.secretPhraseTextArea.pressSequentially(secretPhrase);
    });
  }

  async createPassword(password: string) {
    await test.step('Fill onboarding password fields', async () => {
      await this.createPasswordInput.fill(password);
      await this.confirmPasswordInput.fill(password);
      await this.createPasswordTerms.click();
      await this.createPasswordSubmit.click();
    });
  }
}
