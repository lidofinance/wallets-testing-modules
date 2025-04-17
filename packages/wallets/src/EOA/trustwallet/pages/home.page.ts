import { Locator, Page, test } from '@playwright/test';

export class HomePage {
  networkListBtn: Locator;
  networkRow: Locator;
  closePopoverBtn: Locator;
  rejectTxBtn: Locator;
  homeBtn: Locator;

  constructor(public page: Page) {
    this.networkListBtn = this.page.getByTestId('network-select-button');
    this.networkRow = this.page.getByTestId('network-row');
    this.closePopoverBtn = this.page.getByTestId('close-modal-button');
    this.rejectTxBtn = this.page
      .getByTestId('reject-button')
      .or(this.page.getByText('Reject'))
      .nth(0);
    this.homeBtn = this.page.getByTestId('navigation-item-home');
  }

  async changeNetwork(networkName: string) {
    await test.step(`Change Trust network to ${networkName}`, async () => {
      await this.networkListBtn.click();
      await this.networkRow.getByText(networkName, { exact: true }).click();
      await this.networkRow
        .getByText(networkName, { exact: true })
        .waitFor({ state: 'hidden' });
    });
  }

  async isNetworkExists(networkName: string) {
    return await test.step('Check the network is exists', async () => {
      await this.networkListBtn.click();
      const isNetworkExists =
        (await this.networkRow
          .getByText(networkName, { exact: true })
          .count()) > 0;
      await this.networkListBtn.click();
      return isNetworkExists;
    });
  }

  async closePopover() {
    await test.step('Close popover', async () => {
      while (await this.closePopoverBtn.isVisible()) {
        await this.closePopoverBtn.click();
        await this.page.waitForTimeout(500);
      }
    });
  }

  async rejectTxInQueue() {
    try {
      await this.homeBtn.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      await test.step('Reject tx after wallet unlocking', async () => {
        while (await this.rejectTxBtn.isVisible()) {
          await this.rejectTxBtn.click();
          await this.page.waitForTimeout(500);
        }
      });
    }
  }
}
