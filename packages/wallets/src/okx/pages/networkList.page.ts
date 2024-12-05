import { Locator, Page, test } from '@playwright/test';

export class NetworkList {
  page: Page;
  popularNetworkList: Locator;
  popularNetworkTabButton: Locator;
  userNetworkList: Locator;
  userNetworkTabButton: Locator;
  addCustomNetworkButton: Locator;
  createNetworkInputs: Locator;
  saveNetworkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.popularNetworkTabButton = this.page.locator(
      'div[data-e2e-okd-tabs-pane="0"]',
    );
    this.popularNetworkList = this.page.getByTestId('okd-tabs-panel-0');
    this.userNetworkTabButton = this.page.locator(
      'div[data-e2e-okd-tabs-pane="2"]',
    );
    this.userNetworkList = this.page.getByTestId('okd-tabs-panel-2');
    this.addCustomNetworkButton = this.page.locator(
      'button:has-text("Add custom network")',
    );
    this.createNetworkInputs = this.page.getByTestId('okd-input');
    this.saveNetworkButton = this.page.locator('button:has-text("Save")');
  }

  async isNetworkExist(networkName: string): Promise<boolean> {
    const isNetworkFoundInPopularList =
      await test.step('Check popular network list', async () => {
        await this.popularNetworkTabButton.click();
        return (
          (await this.popularNetworkList
            .getByText(networkName, { exact: true })
            .count()) > 0
        );
      });

    const isNetworkFoundInUserList =
      await test.step('Check user network list', async () => {
        await this.userNetworkTabButton.click();
        return (
          (await this.userNetworkList
            .getByText(networkName, { exact: true })
            .count()) > 0
        );
      });

    return isNetworkFoundInPopularList || isNetworkFoundInUserList;
  }

  async selectNetwork(networkName: string) {
    return await test.step('Check network list', async () => {
      await this.popularNetworkTabButton.click();
      if (
        (await this.popularNetworkList
          .getByText(networkName, { exact: true })
          .count()) > 0
      ) {
        await this.popularNetworkList
          .getByText(networkName, { exact: true })
          .click();
        // wait some time to network setup
        await this.page.waitForTimeout(2000);
        return;
      }

      await this.userNetworkTabButton.click();
      if (
        (await this.userNetworkList
          .getByText(networkName, { exact: true })
          .count()) > 0
      ) {
        await this.userNetworkList
          .getByText(networkName, { exact: true })
          .first()
          .click();
        // wait some time to network setup
        try {
          await this.page
            .getByText('Connecting to')
            .waitFor({ state: 'visible' });
          await this.page
            .getByText('Connecting to')
            .waitFor({ state: 'hidden' });
        } catch {
          console.log('No need to await loading after changing network');
        }
        return;
      }
    });
  }

  async addCustomNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
    scan: string,
  ) {
    await test.step('Add network', async () => {
      await this.userNetworkTabButton.click();
      await this.addCustomNetworkButton.click();
      await this.createNetworkInputs.nth(0).fill(networkName);
      await this.createNetworkInputs.nth(1).fill(networkUrl);
      await this.createNetworkInputs.nth(1).blur();
      // wait for autofill by wallet
      const chainIdInputValue = await this.createNetworkInputs
        .nth(2)
        .getAttribute('value', { timeout: 2000 });
      if (chainIdInputValue !== String(chainId)) {
        await this.createNetworkInputs.nth(2).fill(String(chainId));
      }
      // wait for autofill by wallet
      const tokenSymbolInputValue = await this.createNetworkInputs
        .nth(3)
        .getAttribute('value', { timeout: 2000 });
      if (tokenSymbolInputValue !== tokenSymbol) {
        await this.createNetworkInputs.nth(3).fill(tokenSymbol);
      }
      await this.createNetworkInputs.nth(4).fill(scan);
      while (!(await this.saveNetworkButton.isEnabled())) {
        // wait for Save button to be enabled
        await this.page.waitForTimeout(1000);
      }
      await this.saveNetworkButton.click();
      // need to wait some time to correct install the network
      await this.page.waitForTimeout(2000);
    });
  }

  async getWalletNetwork() {
    return await this.page
      .locator('.okds-success-circle-fill')
      .locator('../..')
      .locator('div')
      .nth(2)
      .textContent();
  }
}