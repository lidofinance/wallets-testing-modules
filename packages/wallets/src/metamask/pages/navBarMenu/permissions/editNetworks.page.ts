import { Locator, Page, test } from '@playwright/test';

export class EditNetworksTab {
  private editNetworkDialog: Locator;
  private selectAllButtonCheckBox: Locator;
  private updateNetworksButton: Locator;

  constructor(public page: Page) {
    this.editNetworkDialog = page.locator('section[role="dialog"]');
    this.selectAllButtonCheckBox = this.editNetworkDialog.getByRole(
      'checkbox',
      { name: 'Select all' },
    );
    this.updateNetworksButton = this.editNetworkDialog.getByTestId(
      'connect-more-chains-button',
    );
  }

  async uncheckAllNetworks() {
    await test.step('Uncheck all networks', async () => {
      while (
        (await this.selectAllButtonCheckBox.getAttribute('class')).match(
          /mm-checkbox__input--(checked|indeterminate)/,
        )
      ) {
        await this.selectAllButtonCheckBox.click();
      }
    });
  }

  async selectNetwork(networkName: string) {
    await test.step(`Select network: ${networkName}`, async () => {
      await this.editNetworkDialog.getByTestId(networkName).click();
    });
  }

  async updateNetworks() {
    await test.step('Click update networks button', async () => {
      await this.updateNetworksButton.click();
    });
  }
}
