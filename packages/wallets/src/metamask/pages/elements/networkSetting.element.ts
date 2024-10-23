import { Locator, Page, test } from '@playwright/test';

export class NetworkSetting {
  page: Page;
  dialogSection: Locator;
  networkListButton: Locator;
  addCustomNetworkButton: Locator;
  addRpcDropDown: Locator;
  addRpcButton: Locator;
  networkNameInput: Locator;
  networkRpcUrlInput: Locator;
  addUrlButton: Locator;
  networkChainIdInput: Locator;
  networkTickerInput: Locator;
  networkExplorerUrlInput: Locator;
  saveNewTokenButton: Locator;
  editNetworkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialogSection = page.locator('section[role="dialog"]');
    this.networkListButton = this.page.getByTestId('network-display');
    this.addCustomNetworkButton = this.dialogSection
      .getByRole('button')
      .getByText('Add a custom network');
    this.networkNameInput = this.page.getByTestId('network-form-network-name');

    this.addRpcDropDown = this.page.getByTestId('test-add-rpc-drop-down');
    this.addRpcButton = this.dialogSection
      .getByRole('button')
      .getByText('Add RPC URL');
    this.addUrlButton = this.page.getByText('Add URL');
    this.networkRpcUrlInput = this.page.getByTestId('rpc-url-input-test');
    this.networkChainIdInput = this.page.getByTestId('network-form-chain-id');
    this.networkTickerInput = this.page.getByTestId(
      'network-form-ticker-input',
    );
    this.networkExplorerUrlInput = this.page.getByTestId(
      'network-form-block-explorer-url',
    );
    this.saveNewTokenButton = this.page.getByText('Save');
    this.editNetworkButton = this.page.getByTestId(
      'network-list-item-options-edit',
    );
  }

  async openNetworkSettings() {
    return this.networkListButton.click();
  }

  async addRpcForExistNetwork(networkUrl, chainId) {
    await test.step('Add rpc url for exist network', async () => {
      await this.dialogSection
        .getByTestId(
          `network-list-item-options-button-0x${chainId.toString(16)}`,
        )
        .click();

      await this.editNetworkButton.click();

      await this.addRpcDropDown.click();
      await this.addRpcButton.click();
      await this.networkRpcUrlInput.fill(networkUrl);
      await this.addUrlButton.click();
    });

    await test.step('Save the new rpc url', async () => {
      await this.saveNewTokenButton.click();
    });
  }

  async addCustomNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
    blockExplorer = '',
  ) {
    await test.step('Add custom network', async () => {
      await this.addCustomNetworkButton.click();
    });

    await test.step('Fill the network fields', async () => {
      await this.networkNameInput.fill(networkName);

      await this.addRpcDropDown.click();
      await this.addRpcButton.click();
      await this.networkRpcUrlInput.fill(networkUrl);
      await this.addUrlButton.click();

      await this.networkChainIdInput.fill(String(chainId));
      await this.networkTickerInput.fill(tokenSymbol);
      if (blockExplorer != '')
        await this.networkExplorerUrlInput.fill(blockExplorer);
    });

    await test.step('Save the new network', async () => {
      await this.saveNewTokenButton.click();
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
      await this.networkListButton.click();
    });

    if (await this.dialogSection.getByText(networkName).isVisible()) {
      await this.addRpcForExistNetwork(networkUrl, chainId);
    } else {
      await this.addCustomNetwork(
        networkName,
        networkUrl,
        chainId,
        tokenSymbol,
        blockExplorer,
      );
    }
  }
}
