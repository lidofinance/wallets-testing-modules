import { Locator, Page, test } from '@playwright/test';

export class HomePage {
  page: Page;
  accountListButton: Locator;
  copyAddressButton: Locator;
  settingButton: Locator;
  networkListButton: Locator;
  manageCryptoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.accountListButton = this.page.locator('img[alt="wallet-avatar"]');
    this.copyAddressButton = this.page
      .getByTestId('okd-select-reference-value-box')
      .locator('../../div')
      .first();
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

  async switchNetworkForDApp(networkName: string) {
    await test.step('Open "DApps connection" page', async () => {
      // Sometimes the OKX wallet displays the notification and cover the setting button
      let attempts = 10;
      while (attempts > 0) {
        await this.settingButton.hover();
        if (await this.page.getByText('DApps connection').isVisible()) break;
        attempts--;
        await this.settingButton.blur();
        await this.page.waitForTimeout(2000);
      }
      await this.page.getByText('DApps connection').click();
    });

    await test.step('Switch network', async () => {
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
    });
  }

  async getWalletAddress() {
    await this.copyAddressButton.click();
    return await this.page
      .locator('span:has-text("address copied")')
      .locator('../span')
      .nth(1)
      .textContent();
  }
}
