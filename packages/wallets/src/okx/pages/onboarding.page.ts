import { FrameLocator, Locator, Page, test } from '@playwright/test';
import { AccountConfig } from '../../wallets.constants';

export class OnboardingPage {
  importWalletButton: Locator;
  iframeLocator: FrameLocator;
  seedPhraseSelect: Locator;
  seedPhraseInputs: Locator;
  confirmSeedPhraseButton: Locator;
  nextButton: Locator;
  passwordInput: Locator;
  confirmButton: Locator;
  startJourneyButton: Locator;
  extensionSetupUrl: string;

  constructor(
    public page: Page,
    public accountConfig: AccountConfig,
    extensionHomeUrl: string,
  ) {
    this.importWalletButton = this.page.locator(
      'button:has-text("Import wallet")',
    );
    this.seedPhraseSelect = this.page.getByText('Seed phrase');
    this.iframeLocator = this.page.locator('iframe').first().contentFrame();
    this.seedPhraseInputs = this.iframeLocator.locator(
      'div[data-testid="okd-popup"] >> input',
    );
    this.confirmSeedPhraseButton = this.iframeLocator.locator(
      'button:has-text("Confirm")',
    );
    this.nextButton = this.iframeLocator.locator('button:has-text("Next")');
    this.passwordInput = this.iframeLocator.locator(
      'input[data-testid="okd-input"]',
    );
    this.confirmButton = this.iframeLocator.locator(
      'button:has-text("Confirm")',
    );
    this.startJourneyButton = this.page.locator(
      "button:has-text('Start your Web3 journey')",
    );
    this.extensionSetupUrl =
      extensionHomeUrl + '#/import-with-seed-phrase-and-private-key';
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      // We need to open the seed phrase import page right away
      // because the wallet closes all tabs and opens the extension after clicking on the seed phrase button on previous pages
      await this.page.goto(this.extensionSetupUrl);

      await test.step('Fill the secret phrase', async () => {
        const seedWords = this.accountConfig.SECRET_PHRASE.split(' ');
        for (let i = 0; i < seedWords.length; i++) {
          await this.seedPhraseInputs.nth(i).fill(seedWords[i]);
        }
        await this.confirmSeedPhraseButton.click();
        await this.nextButton.click();
      });

      await test.step('Fill the password', async () => {
        await this.passwordInput.nth(0).fill(this.accountConfig.PASSWORD);
        await this.passwordInput.nth(1).fill(this.accountConfig.PASSWORD);
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
