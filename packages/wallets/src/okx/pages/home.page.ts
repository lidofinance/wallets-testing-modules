import { Locator, Page, test } from '@playwright/test';

export class HomePage {
  page: Page;
  accountListButton: Locator;
  settingButton: Locator;
  networkListButton: Locator;
  manageCryptoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountListButton = this.page.locator('image[alt="wallet-avatar"]');
    this.settingButton = this.page
      .getByTestId('okd-select-reference-value-box')
      .locator('div')
      .first();
    this.networkListButton = this.page
      .getByTestId('okd-select-reference-value-box')
      .locator('../../div')
      .nth(2);
    this.manageCryptoButton = this.page.locator(
      'button:has-text("Manage crypto")',
    );
  }

  async getTokenBalance(tokenName: string) {
    return await this.page
      .locator(`a :text-is("${tokenName}")`)
      .locator('../../../div')
      .last()
      .textContent();
  }

  async isWalletConnected(pages: Page[]) {
    return await test.step('OKX Wallet peculiarities before network changing', async () => {
      let isButtonDisplayed = false;
      for (const page of pages) {
        setTimeout(() => {
          isButtonDisplayed = true;
        }, 10000);

        // need to open the dApp for display the dApp connected network in the wallet
        // todo: need to refactor to support any stand
        if (
          page.url().includes('stake') || // if stand is the widget (develop/staging/prod)
          page.url().includes('branch-preview') || // if stand is the widget preview stand
          page.url().includes('reef-knot') || //if stand is the reef-knot stand
          page.url().includes('localhost') // if stand is the localhost
        ) {
          // Wait for connected dApp to be displayed
          while (!isButtonDisplayed) {
            try {
              await page.bringToFront(); // open the widget page
              await this.page.bringToFront(); // open the wallet page
              await this.page
                .getByText('Connected')
                .waitFor({ state: 'visible', timeout: 1000 });

              isButtonDisplayed = true;
            } catch {
              isButtonDisplayed = false;
            }
          }
        }
      }
      return isButtonDisplayed;
    });
  }

  async switchNetworkWithConnectedWallet(networkName: string) {
    await this.page.getByText('Connected').click();
    await this.page
      .getByText('EVM-compatible network')
      .locator('..')
      .locator('div')
      .nth(1)
      .click();
    await this.page
      .getByTestId('okd-dialog-container')
      .getByText(networkName, { exact: true })
      .click();
    // need wait some time to correct network install
    await this.page.waitForTimeout(2000);
  }
}
