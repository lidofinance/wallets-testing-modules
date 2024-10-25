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

  networkExplorerDropDown: Locator;
  addBlockExplorerButton: Locator;
  addExplorerUrlButton: Locator;
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
    this.networkExplorerDropDown = this.page.getByTestId(
      'test-explorer-drop-down',
    );
    this.addBlockExplorerButton = this.dialogSection
      .getByRole('button')
      .getByText('Add a block explorer URL');
    this.addExplorerUrlButton = this.dialogSection
      .getByRole('button')
      .getByText('Add URL');
    this.networkExplorerUrlInput = this.page.getByTestId('explorer-url-input');
    this.saveNewTokenButton = this.page.getByText('Save');
    this.editNetworkButton = this.page.getByTestId(
      'network-list-item-options-edit',
    );
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

    const elements = this.page.getByTestId(
      `network-rpc-name-button-0x${chainId.toString(16)}`,
    );

    const rpcUrlsFound = await elements.filter({ hasText: rpcUrl }).count();

    if (rpcUrlsFound == 0) return false;
    return true;
  }

  async openNetworkSettings() {
    return this.networkListButton.click();
  }

  async addRpcForExistNetwork(networkUrl, blockExplorer, chainId) {
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

      if (blockExplorer != '') {
        await this.networkExplorerDropDown.click();
        await this.addBlockExplorerButton.click();
        await this.networkExplorerUrlInput.fill(blockExplorer);
        await this.addExplorerUrlButton.click();
      }
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
      if (blockExplorer != '') {
        await this.networkExplorerDropDown.click();
        await this.addBlockExplorerButton.click();
        await this.networkExplorerUrlInput.fill(blockExplorer);
        await this.addExplorerUrlButton.click();
      }
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
      await this.addRpcForExistNetwork(networkUrl, blockExplorer, chainId);
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

  async switchNetwork(networkName: string) {
    await this.networkListButton.click();
    await this.dialogSection.getByText(networkName).click();
  }
}
