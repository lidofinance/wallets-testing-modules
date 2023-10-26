import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page } from '@playwright/test';
import * as process from 'process';

export class MetamaskPage implements WalletPage {
  page: Page | undefined;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async navigate() {
    await test.step('Navigate to metamask', async () => {
      this.page = await this.browserContext.newPage();
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
      );
      await this.page.reload();
      await this.page.waitForTimeout(1000);
      await this.closePopover();
      await this.unlock();
    });
  }

  async setup() {
    await test.step('Setup', async () => {
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      const firstTime =
        (await this.page.locator('data-testid=onboarding-welcome').count()) > 0;
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

  async closePopover() {
    await test.step('Close popover if exists', async () => {
      if (!this.page) throw "Page isn't ready";
      process.stdout.write('~~ ' + (await this.page.content()));
      const popover =
        (await this.page.getByTestId('popover-close').count()) > 0;
      if (popover) {
        await this.page.click('data-testid=popover-close');
        expect((await this.page.getByTestId('popover-close').count()) === 0);
      }
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.page.click('data-testid=onboarding-terms-checkbox');
      await this.page.click('data-testid=onboarding-import-wallet');
      await this.page.click('data-testid=metametrics-i-agree');
      const inputs = this.page.locator(
        '.import-srp__srp-word >> input[type=password]',
      );
      const seedWords = this.config.SECRET_PHRASE.split(' ');
      for (let i = 0; i < seedWords.length; i++) {
        await inputs.nth(i).fill(seedWords[i]);
      }
      await this.page.click('data-testid=import-srp-confirm');
      await this.page.fill(
        'data-testid=create-password-new',
        this.config.PASSWORD,
      );
      await this.page.fill(
        'data-testid=create-password-confirm',
        this.config.PASSWORD,
      );
      await this.page.click('data-testid=create-password-terms');
      await this.page.click('data-testid=create-password-import');
      await this.page.click('data-testid=onboarding-complete-done');
      await this.page.click('data-testid=pin-extension-next');
      await this.page.click('data-testid=pin-extension-done');
      await this.closePopover();
    });
  }
  async changeNetwork(networkName: string) {
    await test.step(`Change Metamask network to ${networkName}`, async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('data-testid=network-display');
      if (
        (await this.page
          .locator(`button:has-text("${networkName}")`)
          .count()) === 0
      ) {
        await this.page.click(
          'label[class="toggle-button toggle-button--off"]',
        );
      }
      await this.page.click(`button:has-text("${networkName}")`);
      await this.page.waitForSelector(
        `button[data-testid="network-display"]:has-text("${networkName}")`,
      );
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
      await this.page.click('data-testid=account-menu-icon', { force: true });
      await this.page.click('text=Add account or hardware wallet');
      await this.page.click('text=Import account');
      await this.page.fill('id=private-key-box', key);
      await this.page.click("text='Import'");
    });
  }

  async connectWallet(page: Page) {
    await test.step('Connect wallet', async () => {
      await page.click('text=Next');
      await page.click('data-testid=page-container-footer-next');
      await page.close();
    });
  }

  async assertTxAmount(page: Page, expectedAmount: string) {
    await test.step('Assert TX Amount', async () => {
      expect(await page.textContent('.currency-display-component__text')).toBe(
        expectedAmount,
      );
    });
  }

  async confirmTx(page: Page, setAggressiveGas?: boolean) {
    await test.step('Confirm TX', async () => {
      if (setAggressiveGas) {
        await page.getByTestId('edit-gas-fee-button').click();
        await page.getByTestId('edit-gas-fee-item-high').click();
      }
      await page.click('text=Confirm');
    });
  }

  async approveTokenTx(page: Page) {
    await test.step('Approve token tx', async () => {
      await this.useDefaultToApprove(page);
      await page.click('text=Next');
      await page.waitForTimeout(2000);
      await page.click('text=Approve');
    });
  }

  async useDefaultToApprove(page: Page) {
    await test.step('Click "Use default" button in case if it exist', async () => {
      if (!page) throw "Page isn't ready";
      const useDefaultButton =
        (await page.locator('text=Use default').count()) > 0;
      if (useDefaultButton) await page.click('text=Use default');
    });
  }

  async assertReceiptAddress(page: Page, expectedAddress: string) {
    await test.step('Assert receiptAddress/Contract', async () => {
      await page.getByTestId('sender-to-recipient__name').click();
      const receiptAddress = await page
        .locator('div[class="nickname-popover__public-address__constant"]')
        .textContent();
      await page.click('button[data-testid=popover-close]');
      expect(receiptAddress).toBe(expectedAddress);
    });
  }
}
