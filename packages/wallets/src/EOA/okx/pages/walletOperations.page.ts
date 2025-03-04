import { Locator, Page, test } from '@playwright/test';
import { Logger } from '@nestjs/common';

export class WalletOperations {
  logger = new Logger('OKX wallet. WalletOperations');
  connectButton: Locator;
  confirmTxButton: Locator;
  cancelTxButton: Locator;
  rejectTxButton: Locator;
  txYouPayBlock: Locator;
  txAmount: Locator;
  txContract: Locator;

  constructor(public page: Page) {
    this.connectButton = this.page.locator('button:has-text("Connect")');
    this.confirmTxButton = this.page.locator('button:has-text("Confirm")');
    this.cancelTxButton = this.page.locator('button:has-text("Cancel")');
    this.rejectTxButton = this.page.locator('button:has-text("Reject")');
    this.txYouPayBlock = this.page
      .locator('div:has-text("You pay")')
      .locator('../../../../..');
    this.txAmount = this.txYouPayBlock
      .locator('picture')
      .locator('../..')
      .locator('span')
      .first();
    this.txContract = this.page
      .getByText('Interact with')
      .locator('../../../../..')
      .getByTestId('okd-popup')
      .locator('../..');
  }

  async getTxAmount() {
    if (await this.txYouPayBlock.isVisible()) {
      return this.txAmount.textContent();
    }
    return null;
  }

  async getReceiptAddress() {
    return this.txContract.textContent();
  }

  async cancelAllTxInQueue() {
    await test.step('Cancel all tx in queue', async () => {
      try {
        // Try to wait for the extension opens the transaction page with these urls (/evm-dapp, /dapp-entry)
        await this.page.waitForURL(/.*((\/evm-dapp)|(\/dapp-entry))+/, {
          timeout: 5000,
        });
        const needToCancelTx = true;
        while (needToCancelTx) {
          await this.page
            .locator('button :text-matches("Cancel|Reject")')
            .waitFor({ state: 'visible', timeout: 3000 });

          let cancelButton: Locator;
          if (await this.cancelTxButton.isVisible()) {
            cancelButton = this.cancelTxButton;
          } else if (await this.rejectTxButton.isVisible()) {
            cancelButton = this.rejectTxButton;
          } else {
            break;
          }

          try {
            await cancelButton.click();
            // need wait for the extension is close the transaction
            await this.page.waitForTimeout(2000);
          } catch {
            this.logger.log('Cancel button is disappeared');
          }
        }
      } catch {
        this.logger.log('No operations to reject');
      }
    });
  }
}
