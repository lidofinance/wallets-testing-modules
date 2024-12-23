import { Locator, Page, test } from '@playwright/test';
import { NetworkSetting } from './networkSetting.element';

export class NetworkList {
  page: Page;
  networkSetting: NetworkSetting;

  networkListButton: Locator;
  dialogSection: Locator;
  addCustomNetworkButton: Locator;
  networkDisplayCloseBtn: Locator;
  networkItemBtn: Locator;
  networkItemText: Locator;
  editNetworkButton: Locator;
  approveAddNetworkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.networkSetting = new NetworkSetting(this.page);

    this.networkListButton = this.page.getByTestId('network-display');
    this.dialogSection = this.page.getByRole('dialog');
    this.addCustomNetworkButton = this.dialogSection
      .getByRole('button')
      .getByText('Add a custom network');
    this.networkDisplayCloseBtn = this.dialogSection
      .locator('[aria-label="Close"]')
      .first();
    this.networkItemBtn = this.dialogSection.locator('div[role="button"]');
    this.networkItemText = this.networkItemBtn.locator('p');
    this.editNetworkButton = this.page.getByTestId(
      'network-list-item-options-edit',
    );
    this.approveAddNetworkButton = this.page.getByTestId(
      'confirmation-submit-button',
    );
  }

  async clickToNetwork(networkName: string) {
    await test.step(`Click to "${networkName}" network`, async () => {
      await this.dialogSection.getByText(networkName).click();
    });
  }

  async switchNetwork(networkName: string) {
    await this.networkListButton.click();
    await this.dialogSection.getByText(networkName).click();
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

  async openModalNetworkEdit(chainId: any) {
    await this.dialogSection
      .getByTestId(`network-list-item-options-button-0x${chainId.toString(16)}`)
      .click();
    await this.editNetworkButton.click();
  }

  async isNetworkExist(
    networkName: string,
    rpcUrl: string,
    chainId: number,
  ): Promise<boolean> {
    const existNetworkByName = this.dialogSection.getByTestId(networkName);
    if (await existNetworkByName.isHidden()) {
      return false;
    }
    // that locator exists only for added networks
    const elements = this.page.getByTestId(
      `network-rpc-name-button-0x${chainId.toString(16)}`,
    );
    const rpcUrlsFound = await elements.filter({ hasText: rpcUrl }).count();

    if (rpcUrlsFound == 0) return false;
    return true;
  }

  async addNetworkManually(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
    blockExplorer = '',
  ) {
    await test.step('Open the form to add network manually', async () => {
      await this.networkListButton.click();
    });

    if (await this.dialogSection.getByText(networkName).isVisible()) {
      await this.openModalNetworkEdit(chainId);
      await this.networkSetting.addRpcForNetwork(networkUrl, blockExplorer);
    } else {
      await test.step('Add custom network', async () => {
        await this.addCustomNetworkButton.click();
      });
      await this.networkSetting.addCustomNetwork(
        networkName,
        networkUrl,
        chainId,
        tokenSymbol,
        blockExplorer,
      );
    }
  }

  async addPopularNetwork(networkName: string) {
    await this.networkListButton.click();
    const networkListText = await this.getNetworkListText();
    if (networkListText.includes(networkName)) {
      await this.clickToNetworkItemButton(networkName);
    } else {
      await test.step(`Add popular network "${networkName}"`, async () => {
        await this.networkDisplayCloseBtn.click();
        await test.step(`Open the form to add the popular network (${networkName})`, async () => {
          await this.networkListButton.click();
        });
        await test.step(`Add the "${networkName}" network`, async () => {
          await this.dialogSection
            .getByText(networkName)
            .locator('../../..')
            .locator('button:has-text("Add")')
            .click();
          // Without awaiting the button is not clickable
          await this.page.waitForTimeout(500);
          await this.approveAddNetworkButton.click();
          await this.dialogSection.waitFor({ state: 'hidden' });
          // Need to wait while the network to be added to the wallet
          try {
            await this.page
              .getByText('Connecting to')
              .waitFor({ state: 'visible', timeout: 5000 });
            await this.page
              .getByText('Connecting to')
              .waitFor({ state: 'hidden' });
          } catch {
            console.error('Connecting network was without loader');
          }
        });
      });
    }
    await this.page.close();
  }
}
