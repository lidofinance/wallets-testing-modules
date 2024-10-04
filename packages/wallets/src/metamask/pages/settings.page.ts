import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';
import { PopoverElements } from './elements';

export class SettingsPage {
  page: Page;
  tabBarMenu: Locator;
  networksTabButton: Locator;
  experimentalTabButton: Locator;
  addNetworkButton: Locator;
  addNetworkManuallyButton: Locator;
  networkNameInput: Locator;
  networkRpcUrlInput: Locator;
  networkChainIdInput: Locator;
  networkTickerInput: Locator;
  networkExplorerUrlInput: Locator;
  saveNewTokenButton: Locator;
  selectNetworksForEachSiteToggleState: Locator;
  selectNetworksForEachSiteToggle: Locator;

  constructor(
    page: Page,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {
    this.page = page;
    this.tabBarMenu = this.page.locator('.tab-bar');
    this.networksTabButton = this.tabBarMenu
      .getByRole('button')
      .getByText('Networks');
    this.experimentalTabButton = this.tabBarMenu
      .getByRole('button')
      .getByText('Experimental');

    // Networks page locators
    this.addNetworkButton = this.page
      .locator('.networks-tab__body')
      .getByRole('button')
      .getByText('Add a network');
    this.addNetworkManuallyButton = this.page.getByTestId(
      'add-network-manually',
    );
    this.networkNameInput = this.page.getByTestId('network-form-network-name');
    this.networkRpcUrlInput = this.page.getByTestId('network-form-rpc-url');
    this.networkChainIdInput = this.page.getByTestId('network-form-chain-id');
    this.networkTickerInput = this.page.getByTestId(
      'network-form-ticker-input',
    );
    this.networkExplorerUrlInput = this.page.getByTestId(
      'network-form-block-explorer-url',
    );
    this.saveNewTokenButton = this.page.getByText('Save');

    // Experimental page locators
    this.selectNetworksForEachSiteToggleState = this.page
      .getByTestId('experimental-setting-toggle-request-queue')
      .locator('label');
    this.selectNetworksForEachSiteToggle = this.page
      .getByTestId('experimental-setting-toggle-request-queue')
      .locator('input')
      .locator('..');
  }

  async openSettings() {
    await test.step('Open wallet setting page', async () => {
      await this.page.goto(
        this.extensionUrl +
          this.config.COMMON.EXTENSION_START_PATH +
          '#settings',
      );
    });
  }

  async setupNetworkChangingSetting() {
    await test.step('Turn off the toggle of the setting network changing', async () => {
      await this.openSettings();
      await this.experimentalTabButton.click();
      await this.selectNetworksForEachSiteToggle.click();
    });
  }

  async addNetworkManually(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
    blockExplorer = '',
  ) {
    await test.step('Open the form to add network manually', async () => {
      await this.addNetworkButton.click();
      await this.addNetworkManuallyButton.click();
    });
    await test.step('Fill the network fields', async () => {
      await this.networkNameInput.fill(networkName);
      await this.networkRpcUrlInput.fill(networkUrl);
      await this.networkChainIdInput.fill(String(chainId));
      await this.networkTickerInput.fill(tokenSymbol);
      if (blockExplorer != '')
        await this.networkExplorerUrlInput.fill(blockExplorer);
    });
    await test.step('Save the new network', async () => {
      await this.saveNewTokenButton.click();
    });
  }

  async addPopularNetwork(networkName: string) {
    await test.step('Open the page to add network', async () => {
      await this.addNetworkButton.click();
    });
    await test.step(`Add the "${networkName}" network`, async () => {
      await this.page
        .locator(`h6:has-text("${networkName}")`)
        .locator('../../..')
        .locator('button:has-text("Add")')
        .click();
      await new PopoverElements(this.page).approveAddNetworkButton.click();
    });
  }
}
