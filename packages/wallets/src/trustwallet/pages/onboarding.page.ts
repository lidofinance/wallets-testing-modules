import { Locator, Page, test, expect } from '@playwright/test';
import { AccountConfig } from '../../wallets.constants';
import { ConsoleLogger } from '@nestjs/common';

export class OnboardingPage {
  logger = new ConsoleLogger(`TrustWallet. ${OnboardingPage.name}`);
  onboardingTitle: Locator;
  secureWalletOptionPassword: Locator;
  termsOfUseCheckbox: Locator;
  importWalletBtn: Locator;
  newPasswordInput: Locator;
  confirmBtn: Locator;
  seedPhraseTextArea: Locator;

  constructor(public page: Page, public accountConfig: AccountConfig) {
    this.onboardingTitle = this.page.getByTestId('onboarding-step-title');
    this.secureWalletOptionPassword = this.page
      .getByRole('button')
      .getByText('Password');
    this.termsOfUseCheckbox = this.page.getByRole('checkbox');
    this.importWalletBtn = this.page.getByText('I already have a wallet');
    this.newPasswordInput = this.page.getByTestId('password-field');
    this.confirmBtn = this.page.locator('button:has-text("Confirm")');
    this.seedPhraseTextArea = this.page.locator('textarea');
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      await this.onboardingTitle.waitFor({ state: 'visible' });
      await this.termsOfUseCheckbox.click();
      await this.importWalletBtn.click();

      await test.step('Step 1 of 3. Secure your wallet', async () => {
        await this.page.getByRole('button').getByText('Password').click();

        try {
          await this.newPasswordInput
            .nth(0)
            .waitFor({ timeout: 2000, state: 'visible' });
          expect(await this.newPasswordInput.count()).toEqual(2);
        } catch (er) {
          this.logger.log('The wallet does not need to be configured');
          return;
        }

        await test.step('Setup wallet password', async () => {
          await this.newPasswordInput.nth(0).fill(this.accountConfig.PASSWORD);
          await this.newPasswordInput.nth(1).fill(this.accountConfig.PASSWORD);
          await this.page.locator('button:has-text("Continue")').click();
        });
      });

      await test.step('Step 2 of 3. Import wallet', async () => {
        await test.step('Select your existing wallet', async () => {
          await this.page
            .getByTestId('onboarding-select-import-method-trust-wallet')
            .click();
          await this.seedPhraseTextArea.waitFor({
            state: 'visible',
            timeout: 2000,
          });
          await this.seedPhraseTextArea.fill(this.accountConfig.SECRET_PHRASE);
          await this.page.locator('button:has-text("Import")').click();
          await this.onboardingTitle.waitFor({ state: 'visible' });
        });
      });

      await test.step('Step 3 of 3.Confirm wallet created', async () => {
        await this.page.locator('button:has-text("Open my wallet")').click();
      });
    });
  }
}
