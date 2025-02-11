import { Locator, Page, test } from '@playwright/test';

export class SettingPage {
  page: Page;
  settingBtn: Locator;
  networkMenuBtn: Locator;
  addCustomNetworkBtn: Locator;
  networkNameInput: Locator;
  rpcUrlInput: Locator;
  chainIdInput: Locator;
  tokenSymbolInput: Locator;
  scanInput: Locator;
  saveCustomNetworkBtn: Locator;

  constructor(page: Page) {
    this.page = page;
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

  async addNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
    scan?: string,
  ) {
    await test.step('Add network', async () => {
      await this.networkMenuBtn.click();
      await this.addCustomNetworkBtn.click();

      await test.step('Fill network inputs', async () => {
        await this.networkNameInput.fill(networkName);
        await this.rpcUrlInput.fill(networkUrl);
        await this.chainIdInput.fill(String(chainId));
        await this.tokenSymbolInput.fill(tokenSymbol);
        if (scan) await this.scanInput.fill(scan);
      });

      await this.saveCustomNetworkBtn.click();
    });
  }
}
