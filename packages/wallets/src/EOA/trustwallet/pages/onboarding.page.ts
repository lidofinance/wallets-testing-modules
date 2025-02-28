import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../../wallets.constants';

export class OnboardingPage {
  importWalletBtn: Locator;
  newPasswordInput: Locator;
  confirmNewPasswordInput: Locator;
  agreementCheckbox: Locator;
  nextBtn: Locator;
  seedPhraseTypeInput: Locator;
  seedPhraseInputs: Locator;
  noThanksBtn: Locator;

  constructor(public page: Page, public config: WalletConfig) {
    this.importWalletBtn = this.page.getByText('Import or recover wallet');
    this.newPasswordInput = this.page.locator(
      'xpath=//p[contains(text(), "New password")]//following-sibling::div//input',
    );
    this.confirmNewPasswordInput = this.page.locator(
      'xpath=//p[contains(text(), "Confirm new password")]//following-sibling::div//input',
    );
    this.agreementCheckbox = this.page.locator('input[type=checkbox]');
    this.nextBtn = this.page.locator('button:has-text("Next")');
    this.seedPhraseTypeInput = this.page.locator(
      '#headlessui-listbox-button-1',
    );
    this.seedPhraseInputs = this.page.locator('input[type="password"]');
    this.noThanksBtn = this.page.locator('button:has-text("No thanks")');
  }

  async firstTimeSetup() {
    await this.page.waitForSelector(
      'text="Welcome to the Trust Wallet Extension"',
    );

    await test.step('First time setup', async () => {
      await this.importWalletBtn.click();
      if (!(await this.newPasswordInput.isVisible())) return;

      await test.step('Setup wallet password', async () => {
        await this.newPasswordInput.fill(this.config.PASSWORD);
        await this.confirmNewPasswordInput.fill(this.config.PASSWORD);
        await this.agreementCheckbox.click();
        await this.nextBtn.click();
      });

      await test.step('Fill the seed phrase', async () => {
        await this.seedPhraseTypeInput.waitFor({
          state: 'visible',
          timeout: 2000,
        });
        const seedWords = this.config.SECRET_PHRASE.split(' ');
        for (let i = 0; i < seedWords.length; i++) {
          await this.seedPhraseInputs.nth(i).fill(seedWords[i]);
        }
        await this.nextBtn.click();
      });

      await this.noThanksBtn.click();
      await this.page.waitForSelector(
        'text=You have successfully imported your wallet!',
      );
    });
  }
}
