import { Locator, Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';

export class TransactionPage {
  logger = new ConsoleLogger(`Safe. ${TransactionPage.name}`);
  transactionCardContent: Locator;
  contractExplorerUrl: Locator;
  tokenAmount: Locator;
  executeTxBtn: Locator;
  finishTxBtn: Locator;

  constructor(public page: Page) {
    this.transactionCardContent = this.page.getByTestId('card-content').first();
    this.contractExplorerUrl = this.transactionCardContent
      .getByTestId('explorer-btn')
      .first();
    this.tokenAmount = this.transactionCardContent.getByTestId('token-amount');
    this.executeTxBtn = this.page.getByTestId('execute-form-btn');
    this.finishTxBtn = this.page.getByTestId('finish-transaction-btn');
  }

  async getContractOfTransaction() {
    const contractExplorerUrl = await this.contractExplorerUrl.getAttribute(
      'href',
    );
    const match = contractExplorerUrl.match(/address\/([^/\s]+)/);
    return match ? match[1] : null;
  }

  async confirmTransaction() {
    const [extensionTxPage] = await Promise.all([
      this.executeTxBtnClick(),
      this.executeTxBtn.click(),
    ]);
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
