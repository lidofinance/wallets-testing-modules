import { Locator, Page, test } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class HomePage {
  page: Page;
  activityTabButton: Locator;
  nftTabButton: Locator;
  tokensTabButton: Locator;
  activityList: Locator;
  transactionExplorerButton: Locator;
  tokensListItemValues: Locator;
  importTokenButton: Locator;

  constructor(
    page: Page,
    private extensionUrl: string,
    public config: WalletConfig,
  ) {
    this.page = page;

    // Activity tab locators
    this.activityTabButton = this.page
      .getByTestId('account-overview__activity-tab')
      .getByRole('button');
    this.activityList = this.page.getByTestId('activity-list-item');

    // Explorer button of the opened tx
    this.transactionExplorerButton = this.page.getByText(
      'View on block explorer',
    );

    // NFT tab locators
    this.nftTabButton = this.page
      .getByTestId('account-overview__nfts-tab')
      .getByRole('button');

    // Tokens tab locators
    this.tokensTabButton = this.page
      .getByTestId('account-overview__asset-tab')
      .getByRole('button');
    this.tokensListItemValues = this.page.getByTestId(
      'multichain-token-list-item-value',
    );
    this.importTokenButton = this.page.getByText('import tokens');
  }

  async openWidgetPage() {
    await this.page.goto(
      this.extensionUrl + this.config.COMMON.EXTENSION_START_PATH,
    );
  }

  async openActivityTab() {
    await test.step('Open wallet Activity tab', async () => {
      await this.activityTabButton.click();
    });
  }

  async openNftTab() {
    await test.step('Open wallet NFT tab', async () => {
      await this.nftTabButton.click();
    });
  }

  async openTokensTab() {
    await test.step('Open wallet Tokens tab', async () => {
      await this.tokensTabButton.click();
    });
  }

  async openTxInfo(txIndex: number) {
    await test.step('Open transaction info modal', async () => {
      await this.activityList.nth(txIndex).click();
    });
  }

  async openTransactionEthplorerPage() {
    return await test.step('Open transaction ethplorer page', async () => {
      const [etherscanPage] = await Promise.all([
        this.page.context().waitForEvent('page', { timeout: 10000 }),
        this.transactionExplorerButton.click(),
      ]);
      await this.page.close();
      return etherscanPage;
    });
  }
}
