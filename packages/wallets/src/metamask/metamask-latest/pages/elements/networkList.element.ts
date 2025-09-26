import { Locator, Page, test } from '@playwright/test';
import { NetworkConfig } from '../../../../wallets.constants';
import { ConsoleLogger } from '@nestjs/common';
import { SettingsElement } from './settings.element';
import { NetworkSetting } from './networkSetting.element';

export class NetworkList {
  logger = new ConsoleLogger(`MetaMask. ${NetworkList.name}`);
  settings: SettingsElement;
  networkSetting: NetworkSetting;

  dialogSection: Locator;
  addCustomNetworkButton: Locator;
  networkDisplayCloseBtn: Locator;
  networkItemBtn: Locator;
  networkItemText: Locator;
  editNetworkButton: Locator;
  approveAddNetworkButton: Locator;
  showTestnetButton: Locator;

  constructor(public page: Page) {
    this.settings = new SettingsElement(this.page);
    this.networkSetting = new NetworkSetting(this.page);

    this.dialogSection = this.page.getByRole('dialog');
    this.addCustomNetworkButton = this.dialogSection
      .getByRole('button')
      .getByText('Add a custom network');
    this.networkDisplayCloseBtn = this.dialogSection
      .locator('[aria-label="Close"]')
      .first();
    this.networkItemText = this.dialogSection
      .locator('div[role="button"]')
      .locator('p');
    this.editNetworkButton = this.page.getByTestId(
      'network-list-item-options-edit',
    );
    this.approveAddNetworkButton = this.page.getByTestId(
      'confirmation-submit-button',
    );
    this.showTestnetButton = this.dialogSection.locator('label.toggle-button');
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
      await this.networkItemText.getByText(chainName).click();
    });
  }

  async openModalNetworkEdit(chainId: any) {
    const hexChainId = chainId.toString(16);
    const testIdPrefix = 'network-list-item-options-button-';
    // or locator used for different MM versions from latest and LATEST_STABLE_DOWNLOAD_LINK
    const modalNetworkEditButton = this.dialogSection
      .getByTestId(`${testIdPrefix}0x${hexChainId}`) // old stable version
      .or(this.dialogSection.getByTestId(`${testIdPrefix}eip155:${chainId}`)); // new stable version
    await modalNetworkEditButton.click();
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

    try {
      // By default no rpc label below network Name
      const elements = this.page.getByTestId(
        `network-rpc-name-button-0x${chainId.toString(16)}`,
      );
      return rpcUrl.includes(await elements.textContent({ timeout: 1000 }));
    } catch (Error) {
      return false;
    }
  }

  async addNetworkManually(networkConfig: NetworkConfig) {
    await test.step('Open the form to add network manually', async () => {
      await this.settings.openNetworksSettings();
    });

    if (
      await this.networkItemText.getByText(networkConfig.chainName).isVisible()
    ) {
      await this.openModalNetworkEdit(networkConfig.chainId);
      await this.networkSetting.addRpcForNetwork(
        networkConfig.rpcUrl,
        networkConfig.scan,
      );
    } else {
      await test.step('Add custom network', async () => {
        await this.addCustomNetworkButton.click();
      });
      await this.networkSetting.addCustomNetwork(networkConfig);
    }
  }

  async addPopularTestnetNetwork(networkConfig: NetworkConfig) {
    await this.settings.openNetworksSettings();
    if (
      await this.dialogSection.getByTestId(networkConfig.chainName).isHidden()
    ) {
      await this.showTestnetButton.click();
    }
    await this.dialogSection.getByTestId(networkConfig.chainName).click();
  }

  async addPopularNetwork(networkName: string) {
    await this.settings.openNetworksSettings();
    const networkListText = await this.getNetworkListText();
    if (networkListText.includes(networkName)) {
      await this.clickToNetworkItemButton(networkName);
    } else {
      await test.step(`Add popular network "${networkName}"`, async () => {
        await this.networkDisplayCloseBtn.click();
        await test.step(`Open the form to add the popular network (${networkName})`, async () => {
          await this.settings.openNetworksSettings();
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
            this.logger.log('Connecting network was without loader');
          }
        });
      });
    }
    await this.page.close();
  }
}
