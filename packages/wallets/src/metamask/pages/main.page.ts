import { Locator, Page } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class MainPage {
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
      { waitUntil: 'load' },
    );
  }

  async openActivityTab() {
    await this.activityTabButton.click();
  }

  async openNftTab() {
    await this.nftTabButton.click();
  }

  async openTokensTab() {
    await this.tokensTabButton.click();
  }

  async openTxInfo(txIndex: number) {
    await this.activityList.nth(txIndex).click();
  }

  async openTransactionEthplorerPage() {
    const [etherscanPage] = await Promise.all([
      this.page.context().waitForEvent('page', { timeout: 10000 }),
      this.transactionExplorerButton.click(),
    ]);
    return etherscanPage;
  }
}
