import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

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
    await this.page.goto(
      this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH + '#settings',
      { waitUntil: 'load' },
    );
  }

  async setupNetworkChangingSetting() {
    await test.step('Turn off the toggle of the setting network changing', async () => {
      await this.openSettings();
      await this.experimentalTabButton.click();
      await this.selectNetworksForEachSiteToggle.click();
    });
  }
}