import { Locator, Page, test, expect } from '@playwright/test';
import { WalletConfig } from '../../../wallets.constants';
import { Logger } from '@nestjs/common';

export class OnboardingPage {
  page: Page;
  logger = new Logger('Ctrl wallet. OnboardingPage');
  alreadyHaveWalletBtn: Locator;
  importRecoveryPhraseBtn: Locator;
  passwordInput: Locator;
  nextBtn: Locator;
  importBtn: Locator;
  closeTourBtn: Locator;
  notNowBtn: Locator;
  createPasswordBtn: Locator;
  confirmPasswordBtn: Locator;

  constructor(
    page: Page,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {
    this.page = page;
    this.alreadyHaveWalletBtn = this.page.getByTestId(
      'i-already-have-a-wallet-btn',
    );
    this.importRecoveryPhraseBtn = this.page.getByText(
      'Import with Recovery Phrase',
    );
    this.passwordInput = this.page.locator('input[type="password"]');
    this.nextBtn = this.page.getByTestId('next-btn');
    this.importBtn = this.page.getByTestId('import-btn');
    this.closeTourBtn = this.page.locator(
      '[testID="home-page-tour-close-icon"]',
    );
    this.notNowBtn = this.page.getByText('Not now');
    this.createPasswordBtn = this.page.getByText('create a password');
    this.confirmPasswordBtn = this.page.getByTestId('button');
  }

  async firstTimeSetup() {
    if (await this.isWalletSetup()) return;

    await test.step('First time set up', async () => {
      // Without additional awaiting the extension breaks the next step and redirects a user back
      await this.page.waitForTimeout(2000);
      await this.alreadyHaveWalletBtn.click({ force: true });

      await test.step('Import wallet with recovery phrase', async () => {
        await this.importRecoveryPhraseBtn.click();
        const seedWords = this.config.SECRET_PHRASE.split(' ');
        for (let i = 0; i < seedWords.length; i++) {
          await this.passwordInput.nth(i).fill(seedWords[i]);
        }
        await this.nextBtn.click();
        await this.importBtn.waitFor({ state: 'visible', timeout: 60000 });
        await expect(this.importBtn).toBeEnabled({ timeout: 2000 });
        await this.importBtn.click();
        await this.nextBtn.click();
      });

      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );

      await test.step('Close wallet tour', async () => {
        await this.closeTourBtn.waitFor({ state: 'visible', timeout: 2000 });
        await this.closeTourBtn.click();
      });

      await test.step('Create wallet password', async () => {
        await this.createPasswordBtn.click();
        await this.passwordInput.nth(0).fill(this.config.PASSWORD);
        await this.passwordInput.nth(1).fill(this.config.PASSWORD);
        await this.confirmPasswordBtn.click();
      });
    });
  }

  async isWalletSetup() {
    await test.step('Open the onboarding page', async () => {
      // Need to open onboarding page cause the extension does not redirect from home url automatically
      await this.page.goto(
        this.extensionUrl + '/tabs/onboarding.html#onboarding',
      );
    });
    return await test.step('Check the wallet is set up', async () => {
      try {
        await this.alreadyHaveWalletBtn.waitFor({
          state: 'visible',
          timeout: 5000,
        });
      } catch {
        this.logger.log('Ctrl wallet: Onboarding process is not needed');
      }
      return !(await this.alreadyHaveWalletBtn.isVisible());
    });
  }
}
