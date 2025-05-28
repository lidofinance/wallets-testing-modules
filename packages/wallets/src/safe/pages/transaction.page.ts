import { Locator, Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';
import { WalletPage } from '../../wallet.page';
import { WalletConnectTypes } from '../../wallets.constants';

export class TransactionPage {
  logger = new ConsoleLogger(`Safe. ${TransactionPage.name}`);
  transactionCardContent: Locator;
  contractExplorerUrl: Locator;
  tokenAmount: Locator;
  executeTxBtn: Locator;
  finishTxBtn: Locator;
  switchNetworkBtn: Locator;

  constructor(
    public page: Page,
    public extensionPage: WalletPage<WalletConnectTypes.EOA>,
  ) {
    this.transactionCardContent = this.page.getByTestId('card-content').first();
    this.contractExplorerUrl = this.transactionCardContent
      .getByTestId('explorer-btn')
      .first();
    this.tokenAmount = this.transactionCardContent.getByTestId('token-amount');
    this.executeTxBtn = this.page.getByTestId('execute-form-btn');
    this.finishTxBtn = this.page.getByTestId('finish-transaction-btn');
    this.switchNetworkBtn = this.page.getByText('Switch to');
  }

  async getContractOfTransaction() {
    const contractExplorerUrl = await this.contractExplorerUrl.getAttribute(
      'href',
    );
    const match = contractExplorerUrl.match(/address\/([^/\s]+)/);
    return match ? match[1] : null;
  }

  async confirmTransaction() {
    await this.tokenAmount.waitFor({
      state: 'visible',
      timeout: 10000,
    });

    await test.step('Switch network if needed', async () => {
      if (await this.switchNetworkBtn.isVisible()) {
        const [extensionTxPage] = await Promise.all([
          this.page.context().waitForEvent('page', { timeout: 10000 }),
          await this.switchNetworkBtn.click(),
        ]);
        await this.extensionPage.confirmTx(extensionTxPage);
      }
    });

    const [extensionTxPage] = await Promise.all([
      this.executeTxBtnClick(),
      this.executeTxBtn.click(),
    ]);
    await this.extensionPage.confirmTx(extensionTxPage, true);
    return extensionTxPage;
  }

  private async executeTxBtnClick(maxAttempts = 3) {
    return await test.step('Click to execute transaction button', async () => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const result = await Promise.race([
          this.page
            .context()
            .waitForEvent('page', { timeout: 30000 })
            .then((page) => ({ type: 'page' as const, value: page })),
          this.page
            .waitForSelector('[data-testid="error-message"]', {
              timeout: 30000,
            })
            .then((el) => ({ type: 'error' as const, value: el })),
        ]);
        if (result.type === 'error') {
          await this.executeTxBtn.click();
          this.logger.warn(`attepmt: ${attempt}`);
        } else if (result.type === 'page') {
          return result.value;
        }
      }
      this.logger.error(
        "Extension's page to confirm transaction is not opened",
      );
      return null;
    });
  }

  async getTransactionAmount() {
    return this.tokenAmount.textContent();
  }
}
