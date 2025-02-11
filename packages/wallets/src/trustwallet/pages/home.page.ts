import { Locator, Page, test } from '@playwright/test';

export class HomePage {
  page: Page;
  networkListBtn: Locator;
  networkRow: Locator;

  constructor(page: Page) {
    this.page = page;
    this.networkListBtn = this.page.getByTestId('network-select-button');
    this.networkRow = this.page.getByTestId('network-row');
  }

  async changeNetwork(networkName: string) {
    await test.step(`Change Trust network to ${networkName}`, async () => {
      await this.networkListBtn.click();
      await this.networkRow.getByText(networkName).click();
    });
  }

  async isNetworkExists(networkName: string) {
    return await test.step('Check the network is exists', async () => {
      await this.networkListBtn.click();
      const isNetworkExists =
        (await this.networkRow.getByText(networkName).count()) > 0;
      await this.networkListBtn.click();
      return isNetworkExists;
    });
  }
}
