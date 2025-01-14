import { BrowserContext, Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class OnboardingPage {
  page: Page;
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
    private browserContext: BrowserContext,
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

  async isNeedToGoThroughOnboarding() {
    return await test.step('Open the onboarding page', async () => {
      // Need to open onboarding page cause the extension does not redirect from home url automatically
      await this.page.goto(
        this.extensionUrl + '/tabs/onboarding.html#onboarding',
      );

      const btn = this.page.getByTestId('i-already-have-a-wallet-btn');
      try {
        await btn.waitFor({
          state: 'visible',
          timeout: 5000,
        });
      } catch {
        console.log('Onboarding process is not needed');
      }
      return btn.isVisible();
    });
  }

  async firstTimeSetup() {
    await test.step('First time set up', async () => {
      // Need to wait some time for button enabling
      await this.page.waitForTimeout(1000);
      await this.alreadyHaveWalletBtn.click({ force: true });

      await test.step('Import wallet with recovery phrase', async () => {
        await this.importRecoveryPhraseBtn.click();
        const seedWords = this.config.SECRET_PHRASE.split(' ');
        for (let i = 0; i < seedWords.length; i++) {
          await this.passwordInput.nth(i).fill(seedWords[i]);
        }
        await this.nextBtn.click();
        await this.importBtn.waitFor({ state: 'visible', timeout: 60000 });
        await this.importBtn.click();
        await this.nextBtn.click();
      });
    });
  }

  async closeWalletTour() {
    await test.step('Close wallet tour', async () => {
      await this.closeTourBtn.waitFor({ state: 'visible', timeout: 2000 });
      await this.closeTourBtn.click();
      await this.notNowBtn.waitFor({ state: 'visible', timeout: 2000 });
      await this.notNowBtn.click({ force: true });
    });
  }

  async createWalletPassword() {
    await test.step('Create wallet password', async () => {
      await this.createPasswordBtn.click();
      await this.passwordInput.nth(0).fill(this.config.PASSWORD);
      await this.passwordInput.nth(1).fill(this.config.PASSWORD);
      await this.confirmPasswordBtn.click();
    });
  }
}
