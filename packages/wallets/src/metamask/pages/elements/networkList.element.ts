import { Locator, Page, test } from '@playwright/test';

export class NetworkList {
  page: Page;
  networkDisplayDialog: Locator;
  networkDisplayCloseBtn: Locator;
  networkItemBtn: Locator;
  networkItemText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.networkDisplayDialog = this.page.getByRole('dialog');
    this.networkDisplayCloseBtn = this.networkDisplayDialog
      .locator('[aria-label="Close"]')
      .first();
    this.networkItemBtn =
      this.networkDisplayDialog.locator('div[role="button"]');
    this.networkItemText = this.networkItemBtn.locator('p');
  }

  async clickToNetwork(networkName: string) {
    await test.step(`Click to "${networkName}" network`, async () => {
      await this.networkDisplayDialog.getByText(networkName).click();
    });
  }

  async getNetworkListText() {
    return await test.step('Get network list', async () => {
      const networkList = await this.networkItemText.all();
      return Promise.all(
        networkList.map(async (networkType) => {
          return await networkType.textContent();
        }),
      );
    });
  }

  async clickToNetworkItemButton(chainName: string) {
    await test.step(`Click to "${chainName}" network item button`, async () => {
      await this.networkItemBtn.getByText(chainName).click();
    });
  }
}
