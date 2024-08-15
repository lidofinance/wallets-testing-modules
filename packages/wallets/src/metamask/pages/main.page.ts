import { Locator, Page } from '@playwright/test';
import { WalletConfig } from '../../wallets.constants';

export class MainPage {
  page: Page;
  activityTabButton: Locator;
  nftsTabButton: Locator;
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
    this.activityTabButton = this.page
      .getByTestId('account-overview__activity-tab')
      .getByRole('button');
    this.nftsTabButton = this.page
      .getByTestId('account-overview__nfts-tab')
      .getByRole('button');
    this.tokensTabButton = this.page
      .getByTestId('account-overview__asset-tab')
      .getByRole('button');
    this.activityList = this.page.getByTestId('activity-list-item');

    // Explorer button of tx
    this.transactionExplorerButton = this.page.getByText(
      'View on block explorer',
    );

    // Tokens tab locator
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

  async openNftsTab() {
    await this.nftsTabButton.click();
  }

  async openTokensTab() {
    await this.tokensTabButton.click();
  }
}
