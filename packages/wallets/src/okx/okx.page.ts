import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page } from '@playwright/test';

export class OkxPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to okx', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.page.reload();
      await this.page.waitForTimeout(1000);
      await this.unlock();
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      const firstTime =
        (await this.page.locator("button:has-text('Import wallet')").count()) >
        0;
      if (firstTime) await this.firstTimeSetup();
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.page.locator('id=password').count()) > 0) {
        await this.page.fill('id=password', this.config.PASSWORD);
        await this.page.click('text=Unlock');
      }
    });
  }

  async importTokens(token: string) {
    await test.step('Import token', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      await this.page.click("text='import tokens'");
      await this.page.click('text=Custom token');
      await this.page.type('id=custom-address', token);
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click("button:has-text('Import wallet')");
      await this.page.click('text=Seed Phrase');
      const inputs = this.page.locator('input[type=text]');
      const seedWords = this.config.SECRET_PHRASE.split(' ');
      for (let i = 0; i < seedWords.length; i++) {
        await inputs.nth(i).fill(seedWords[i]);
        if (
          i === seedWords.length - 1 &&
          (await this.page
            .locator(
              `div[class="mnemonic-words-inputs__container__candidate-word"]`,
            )
            .getByText(`${seedWords[i]}`)
            .count()) > 0
        ) {
          await this.page
            .locator(
              `div[class="mnemonic-words-inputs__container__candidate-word"]`,
            )
            .getByText(`${seedWords[i]}`, { exact: true })
            .click();
        }
      }
      await this.page.getByRole('button', { name: 'Confirm' }).click();
      await this.page
        .locator('input[class=okui-input-input]')
        .nth(0)
        .fill(this.config.PASSWORD);
      await this.page
        .locator('input[class=okui-input-input]')
        .nth(1)
        .fill(this.config.PASSWORD);
      await this.page.waitForTimeout(2000);
      await this.page.getByRole('button', { name: 'Confirm' }).click();
      await this.page.waitForSelector("button:has-text('Maybe later')");
      await this.page.waitForTimeout(2000);
    });
  }

  async addNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
  ) {
    await test.step('Add network', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('data-testid=account-options-menu-button');
      await this.page.click('text=Settings');
      await this.page.click("text='Networks'");
      await this.page.click('text=Add a network');
      await this.page.click("a :has-text('Add a network manually')");
      await this.page.fill(
        ".form-field :has-text('Network Name') >> input",
        networkName,
      );
      await this.page.fill(
        ".form-field :has-text('New RPC URL') >> input",
        networkUrl,
      );
      await this.page.fill(
        ".form-field :has-text('Chain ID') >> input",
        String(chainId),
      );
      await this.page.fill(
        ".form-field :has-text('Currency symbol') >> input",
        tokenSymbol,
      );
      await this.page.click('text=Save');
      await this.navigate();
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('data-testid=account-menu-icon');
      await this.page.click('text=Import account');
      await this.page.fill('id=private-key-box', key);
      await this.page.click("text='Import'");
    });
  }
  //+
  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.waitForSelector('button:has-text("Confirm")');
      await page.waitForTimeout(10000);
      await page.getByRole('button', { name: 'Confirm' }).click();
      await page.close();
    });
  }

  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      expect(await page.textContent('.text-ellipsis-tooltip__text')).toBe(
        expectedAmount,
      );
    });
  }

  async confirmTx(page: Page) {
    await test.step('Confirm TX', async () => {
      await page.getByRole('button', { name: 'Confirm' }).click();
    });
  }

  async approveTokenTx(page: Page) {
    await test.step('Approve token tx', async () => {
      await page.getByRole('button', { name: 'Confirm' }).click();
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: 'Confirm' }).click();
    });
  }

  // eslint-disable-next-line
    async assertReceiptAddress(page: Page, expectedAmount: string) {}
}
