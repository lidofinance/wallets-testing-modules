import { WalletConfig } from '../wallets.constants';
import { WalletPage } from '../wallet.page';
import expect from 'expect';
import { test, BrowserContext, Page, Locator } from '@playwright/test';

export class MetamaskPage implements WalletPage {
  page: Page | undefined;
  networkDisplay: Locator;
  networkDisplayDialog: Locator;
  networkDisplayCloseBtn: Locator;
  networkItemBtn: Locator;
  networkItemText: Locator;

  constructor(
    private browserContext: BrowserContext,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {}

  async initLocators() {
    this.networkDisplay = this.page.getByTestId('network-display');
    this.networkDisplayDialog = this.page.locator('[role = "dialog"]');
    this.networkDisplayCloseBtn = this.networkDisplayDialog
      .locator('[aria-label="Close"]')
      .first();

    this.networkItemBtn =
      this.networkDisplayDialog.locator('div[role="button"]');
    this.networkItemText = this.networkItemBtn.locator('p');
  }

  async navigate() {
    await test.step('Navigate to metamask', async () => {
      this.page = await this.browserContext.newPage();
      await this.initLocators();
      await this.page.goto(
        this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
        { waitUntil: 'load' },
      );
      await this.page
        .locator('button[data-testid="app-header-logo"]')
        .waitFor({ state: 'visible' });
      await this.unlock();
      if (await this.networkDisplay.isVisible()) {
        await this.closePopover();
      }
    });
  }

  async goToActivity() {
    await this.page.locator('button:has-text("Activity")').click();
  }

  async setup() {
    await test.step('Setup', async () => {
      // added explicit route to #onboarding due to unexpected first time route from /home.html to /onboarding -> page is close
      await this.navigate();
      if (!this.page) throw "Page isn't ready";
      if (!(await this.networkDisplay.isVisible())) {
        await this.firstTimeSetup();
      }
    });
  }

  async unlock() {
    await test.step('Unlock', async () => {
      if (!this.page) throw "Page isn't ready";
      if ((await this.page.locator('id=password').count()) > 0) {
        await this.page.fill('id=password', this.config.PASSWORD);
        await this.page.click('text=Unlock');
        await this.page.waitForURL('**/home.html#');
        await this.closePopover();
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

  async isPopoverVisible() {
    try {
      const popoverContent = this.page.getByTestId('popover-close');
      await popoverContent.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  async closePopover() {
    await test.step('Close popover if it exists', async () => {
      if (!this.page) throw "Page isn't ready";

      if (await this.isPopoverVisible()) {
        await this.page.getByTestId('popover-close').click();
      }
      if (
        await this.page
          .locator('button:has-text("Manage in settings")')
          .isVisible()
      ) {
        await this.page
          .locator('button:has-text("Manage in settings")')
          .click();
      }

      if (await this.page.getByText('Not right now').isVisible())
        await this.page.click('text=Not right now');

      const gotItBtn = await this.page.getByText('Got it');
      if (await gotItBtn.first().isVisible()) await gotItBtn.first().click();
    });
  }

  async firstTimeSetup() {
    await test.step('First time setup', async () => {
      if (!this.page) throw "Page isn't ready";

      const checkbox = this.page.getByTestId('onboarding-terms-checkbox');
      while (!(await this.page.locator('.check-box__checked').isVisible())) {
        console.log('Checkbox is not checked');
        await checkbox.click();
      }
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
      await this.page.getByTestId('onboarding-complete-done').click();
      await this.page.getByTestId('pin-extension-next').click();
      await this.page.getByTestId('pin-extension-done').click();
      await this.page.waitForURL('**/home.html#');
      await this.closePopover();
    });
  }
  async changeNetwork(networkName: string) {
    await test.step(`Change Metamask network to ${networkName}`, async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      await this.page.click('data-testid=network-display');
      await this.page.locator('section').getByText(networkName).click();

      //Linea network require additional confirmation
      if (networkName === 'Linea Mainnet') {
        await this.closePopover();
      }

      await this.page.close();
    });
  }

  async switchNetwork(networkName = 'Linea Mainnet') {
    await this.navigate();
    await this.page.getByTestId('network-display').click();
    await this.page.getByText(networkName).click();
    await this.page.getByText('Got it').click();
    await this.page.close();
  }

  async setupNetwork(standConfig: Record<string, any>) {
    const networkDisplayText = await this.networkDisplay.textContent();

    if (!networkDisplayText.includes(standConfig.chainName)) {
      await this.networkDisplay.click();

      const networkListText = await this.getNetworkListText();
      if (networkListText.includes(standConfig.chainName)) {
        await this.networkItemBtn.getByText(standConfig.chainName).click();
      } else {
        await this.networkDisplayCloseBtn.click();
        await this.addNetwork(
          standConfig.chainName,
          standConfig.rpcUrl,
          standConfig.chainId,
          standConfig.tokenSymbol,
          standConfig.scan,
        );
      }
    }
  }

  async getNetworkListText() {
    const networkList = await this.networkItemText.all();
    return Promise.all(
      networkList.map(async (networkType) => {
        return await networkType.textContent();
      }),
    );
  }

  async addNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
    blockExplorer = '',
  ) {
    await test.step('Add network', async () => {
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
        '[data-testid="network-form-ticker-input"]',
        tokenSymbol,
      );
      if (blockExplorer != '')
        await this.page.fill(
          ".form-field :has-text('Block explorer URL') >> input",
          blockExplorer,
        );
      await this.page.click('text=Save');
      await this.page.click('text=Switch to ');
    });
  }

  async importKey(key: string) {
    await test.step('Import key', async () => {
      if (!this.page) throw "Page isn't ready";
      await this.navigate();
      // Remove me when MM to be more stable
      do {
        await this.page.reload();
        await this.closePopover();
      } while (!(await this.page.getByTestId('account-menu-icon').isVisible()));
      await this.page.click('data-testid=account-menu-icon');
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

  async confirmAddTokenToWallet(confirmPage: Page) {
    await test.step('Confirm add token to wallet', async () => {
      await confirmPage.locator('button:has-text("Add token")').click();
    });
  }
  async openLastTxInEthplorer(txIndex = 0) {
    if (!this.page) throw "Page isn't ready";
    await this.navigate();
    await this.goToActivity();
    await this.page.getByTestId('activity-list-item').nth(txIndex).click();
    const [, etherscanPage] = await Promise.all([
      await this.page.locator('text=View on block explorer').click(),
      await this.page.context().waitForEvent('page', { timeout: 120000 }),
    ]);
    return etherscanPage;
  }

  async getTokenBalance(tokenName: string) {
    await this.navigate();
    const tokenTab = await this.page
      .getByTestId('home__asset-tab')
      .locator('text=Tokens');
    await tokenTab.click();
    //Cannot find locator by exact text since need to find row by text "stETH"/"ETH" but "stETH" contains "ETH"
    const elements = await this.page.$$(
      'data-testid=multichain-token-list-item-value',
    );
    let tokenBalance = NaN;
    for (const element of elements) {
      await element.waitForElementState('visible');
      const textContent = await element.textContent();
      const letterTextContent = textContent.match(/[a-zA-Z]+/g);
      if (letterTextContent.toString().trim() === tokenName) {
        tokenBalance = parseFloat(await element.textContent());
        break;
      }
    }
    return tokenBalance;
  }

  async confirmTx(page: Page, setAggressiveGas?: boolean) {
    await test.step('Confirm TX', async () => {
      if (setAggressiveGas) {
        await page.click('button[data-testid="edit-gas-fee-icon"]');
        await page.mouse.move(1, 1);
        await page.click('button[data-testid="edit-gas-fee-item-high"]');
      }
      await page.getByTestId('page-container-footer-next').click();
    });
  }

  async signTx(page: Page) {
    await test.step('Sign TX', async () => {
      await page.getByTestId('signature-request-scroll-button').click();
      await page.getByTestId('page-container-footer-next').click();
    });
  }

  async rejectTx(page: Page) {
    await test.step('Reject TX', async () => {
      await page.click('text=Reject');
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
      const recipient = page.locator(
        '.sender-to-recipient__party--recipient-with-address',
      );
      while (!(await recipient.isEnabled())) {
        await this.page.waitForTimeout(500);
      }
      await recipient.click();
      const recipientAddress = await page
        .locator('input[id="address"]')
        .getAttribute('value');
      await page.click('button[aria-label="Close"]');
      expect(recipientAddress).toBe(expectedAddress);
    });
  }
  async getWalletAddress() {
    await this.navigate();
    await this.page.getByTestId('account-options-menu-button').click();
    await this.page.getByTestId('account-list-menu-details').click();
    const address = await this.page
      .locator("button[data-testid='address-copy-button-text']")
      .textContent();
    await this.page.close();
    return address;
  }

  async changeWalletAddress(addressName: string) {
    await this.navigate();
    await this.page.click('data-testid=account-menu-icon');
    await this.page.click(`text=${addressName}`);
    const accountNumber = this.page.locator(
      `button[data-testid="account-menu-icon"]:has-text("${addressName}")`,
    );
    await accountNumber.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.close();
  }
}
