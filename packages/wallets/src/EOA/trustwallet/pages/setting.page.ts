import { Locator, Page, test } from '@playwright/test';
import { NetworkConfig } from '../../../wallets.constants';

export class SettingPage {
  settingBtn: Locator;
  networkMenuBtn: Locator;
  addCustomNetworkBtn: Locator;
  networkNameInput: Locator;
  rpcUrlInput: Locator;
  chainIdInput: Locator;
  tokenSymbolInput: Locator;
  scanInput: Locator;
  saveCustomNetworkBtn: Locator;

  constructor(public page: Page) {
    this.settingBtn = this.page.getByTestId('navigation-item-settings');
    this.networkMenuBtn = this.page.getByText('Network');
    this.addCustomNetworkBtn = this.page.getByTestId(
      'networks-add-network-button',
    );
    this.networkNameInput = this.page.getByTestId('custom-network-name');
    this.rpcUrlInput = this.page.getByTestId('custom-network-rpcUrl');
    this.chainIdInput = this.page.getByTestId('custom-network-chainId');
    this.tokenSymbolInput = this.page.getByTestId(
      'custom-network-currency-symbol',
    );
    this.scanInput = this.page.getByTestId('custom-network-explorerUrl');
    this.saveCustomNetworkBtn = this.page.getByTestId(
      'custom-network-add-button',
    );
  }

  async openSetting() {
    await test.step('Open setting page', async () => {
      await this.settingBtn.click();
    });
  }

  async addNetwork(networkConfig: NetworkConfig) {
    await test.step('Add network', async () => {
      await this.networkMenuBtn.click();
      await this.addCustomNetworkBtn.click();

      await test.step('Fill network inputs', async () => {
        await this.networkNameInput.fill(networkConfig.chainName);
        await this.rpcUrlInput.fill(networkConfig.rpcUrl);
        await this.chainIdInput.fill(String(networkConfig.chainId));
        await this.tokenSymbolInput.fill(networkConfig.tokenSymbol);
        await this.scanInput.fill(networkConfig.scan);
      });

      await this.saveCustomNetworkBtn.click();
    });
  }
}
