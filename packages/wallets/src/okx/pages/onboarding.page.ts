import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class OnboardingPage {
  page: Page;
  importWalletButton: Locator;
  seedPhraseSelect: Locator;
  seedPhraseInputs: Locator;
  confirmSeedPhraseButton: Locator;
  nextButton: Locator;
  passwordInput: Locator;
  confirmButton: Locator;
  startJourneyButton: Locator;

  constructor(page: Page, public config: WalletConfig) {
    this.page = page;
    this.importWalletButton = this.page.locator(
      'button:has-text("Import wallet")',
    );
    this.seedPhraseSelect = this.page.getByText('Seed phrase');
    this.seedPhraseInputs = this.page.locator(
      'div[data-testid="okd-popup"] >> input',
    );
    this.confirmSeedPhraseButton = this.page.locator(
      'button:has-text("Confirm")',
    );
    this.nextButton = this.page.locator('button:has-text("Next")');
    this.passwordInput = this.page.locator('input[data-testid="okd-input"]');
    this.confirmButton = this.page.locator('button:has-text("Confirm")');
    this.startJourneyButton = this.page.locator(
      "button:has-text('Start your Web3 journey')",
    );
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      await this.importWalletButton.click();

      await test.step('Fill the secret phrase', async () => {
        await this.seedPhraseSelect.click();
        const seedWords = this.config.SECRET_PHRASE.split(' ');
        for (let i = 0; i < seedWords.length; i++) {
          await this.seedPhraseInputs.nth(i).fill(seedWords[i]);
        }
        await this.confirmSeedPhraseButton.click();
        await this.nextButton.click();
      });

      await test.step('Fill the password', async () => {
        await this.passwordInput.nth(0).fill(this.config.PASSWORD);
        await this.passwordInput.nth(1).fill(this.config.PASSWORD);
        await this.confirmButton.click();
      });

      // Dive into wallet main page after installation
      await this.startJourneyButton.click({ timeout: 90000 });
      // Wait until extension to be loaded after installation with ETH value display.
      // ETH value displayed with ETH symbol
      await this.page.waitForSelector('text=ETH', { state: 'visible' });
      //Looks like after installation and load extension mainPage there we should to wait a bit for extension make sure to be installed in some memory
      await this.page.waitForTimeout(2000);
    });
  }
}
