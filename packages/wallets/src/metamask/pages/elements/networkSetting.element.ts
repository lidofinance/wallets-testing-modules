import { Locator, Page, test } from '@playwright/test';
import { NetworkConfig } from '../../../wallets.constants';

export class NetworkSetting {
  page: Page;
  dialogSection: Locator;
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

  constructor(page: Page) {
    this.page = page;
    this.dialogSection = page.locator('section[role="dialog"]');

    this.networkNameInput = this.page.getByTestId('network-form-network-name');
    this.addRpcDropDown = this.page.getByTestId('test-add-rpc-drop-down');
    this.addRpcButton = this.dialogSection.locator(
      'button:has-text("Add RPC URL")',
    );
    this.addUrlButton = this.page.getByText('Add URL');
    this.networkRpcUrlInput = this.page.getByTestId('rpc-url-input-test');
    this.networkChainIdInput = this.page.getByTestId('network-form-chain-id');
    this.networkTickerInput = this.page.getByTestId(
      'network-form-ticker-input',
    );
    this.networkExplorerDropDown = this.page.getByTestId(
      'test-explorer-drop-down',
    );
    this.addBlockExplorerButton = this.dialogSection.locator(
      'button:has-text("Add a block explorer URL")',
    );
    this.addExplorerUrlButton = this.dialogSection.locator(
      'button:has-text("Add URL")',
    );
    this.networkExplorerUrlInput = this.page.getByTestId('explorer-url-input');
    this.saveNewTokenButton = this.page.getByText('Save');
  }

  async addRpcForNetwork(networkUrl, blockExplorer) {
    await test.step('Add rpc url for exist network', async () => {
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

  async addCustomNetwork(networkConfig: NetworkConfig) {
    await test.step('Fill the network fields', async () => {
      await test.step('Fill the network name', async () => {
        await this.networkNameInput.fill(networkConfig.chainName);
      });
      await test.step('Fill the network rpc', async () => {
        await this.addRpcDropDown.click();
        await this.addRpcButton.click();
        await this.networkRpcUrlInput.fill(networkConfig.rpcUrl);
        await this.addUrlButton.click();
      });
      await test.step('Fill the network chainId', async () => {
        await this.networkChainIdInput.fill(String(networkConfig.chainId));
      });
      await test.step('Fill the network token symbol', async () => {
        await this.networkTickerInput.fill(networkConfig.tokenSymbol);
      });
      await test.step('Fill the network explorer url', async () => {
        await this.networkExplorerDropDown.click();
        await this.addBlockExplorerButton.click();
        await this.networkExplorerUrlInput.fill(networkConfig.scan);
        await this.addExplorerUrlButton.click();
      });
    });

    await test.step('Save the new network', async () => {
      await this.saveNewTokenButton.click();
    });
  }
}
