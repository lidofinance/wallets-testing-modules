import { Locator, Page, test } from '@playwright/test';

export class WalletOperationPage {
  page: Page;
  connectBtn: Locator;
  confirmButton: Locator;
  approvalCancelButton: Locator;
  cancelButton: Locator;
  addTokenButton: Locator;
  editGasFeeButton: Locator;
  setHighGasFeeButton: Locator;
  scrollRequestSignatureBlockButton: Locator;
  cancelAllTxsButton: Locator;
  confirmRejectAllTxsButton: Locator;
  recipientButton: Locator;
  recipientAddress: Locator;
  popover: Locator;
  popoverCloseButton: Locator;
  txDetailBlock: Locator;
  txDetailAmount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.connectBtn = this.page.getByTestId('confirm-btn');
    this.confirmButton = this.page.getByTestId('confirm-footer-button');
    this.approvalCancelButton = this.page.getByTestId(
      'page-container-footer-cancel',
    );
    this.cancelButton = this.page.getByTestId('confirm-footer-cancel-button');
    this.addTokenButton = this.page.locator('button:has-text("Add token")');
    this.editGasFeeButton = this.page.getByTestId('edit-gas-fee-icon');
    this.setHighGasFeeButton = this.page.getByTestId('edit-gas-fee-item-high');
    this.scrollRequestSignatureBlockButton = this.page.getByTestId(
      'signature-request-scroll-button',
    );
    this.cancelAllTxsButton = this.page.getByTestId('confirm-nav__reject-all');
    this.confirmRejectAllTxsButton = this.page.locator(
      'button:has-text("Reject all")',
    );
    this.recipientButton = this.page
      .getByTestId('transaction-details-recipient-row')
      .locator('.name');
    this.recipientAddress = this.page.locator('input[id="address"]');
    this.popover = this.page.locator('section[role="dialog"]');
    this.popoverCloseButton = this.popover.locator(
      'button[aria-label="Close"]',
    );
    this.txDetailBlock = this.page.getByTestId('simulation-details-layout');
    this.txDetailAmount = this.txDetailBlock.getByTestId(
      'simulation-details-amount-pill',
    );
  }

  async cancelAllTxInQueue() {
    await test.step('Cancel all tx in queue', async () => {
      //Is there is any tx in queue.
      try {
        await this.cancelButton.waitFor({
          state: 'visible',
          timeout: 1000,
        });
      } catch (er) {
        return;
      }

      if (await this.cancelAllTxsButton.isVisible()) {
        await this.cancelAllTxsButton.click();
      } else {
        await this.cancelButton.click();
      }
    });
  }

  async cancelTransaction() {
    try {
      await this.cancelButton.click();
    } catch {
      await this.approvalCancelButton.click();
    }
  }

  async confirmTransactionOfTokenApproval() {
    await test.step('Click "Use default" button in case if it exist', async () => {
      // todo: im not sure this step is needed now
      if (await this.page.locator('text=Use default').isVisible())
        await this.page.click('text=Use default');
    });
    await this.confirmButton.click();
    await this.page.close().catch(() => {
      console.log('[INFO] Tx page closed on its own');
    });
  }

  async confirmTransaction(setAggressiveGas?: boolean) {
    if (setAggressiveGas) {
      await this.editGasFeeButton.click();
      await this.page.mouse.move(1, 1);
      await this.setHighGasFeeButton.click();
    }
    await this.confirmButton.waitFor({ state: 'visible', timeout: 30000 });
    // Additional delay before confirm tx
    await this.page.waitForTimeout(1000);
    await this.confirmButton.click();
  }

  async getReceiptAddress() {
    while (!(await this.recipientButton.isEnabled())) {
      await this.page.waitForTimeout(100);
    }
    await this.recipientButton.click();
    const recipientAddress = await this.recipientAddress.getAttribute('value');
    await this.popoverCloseButton.click();
    return recipientAddress;
  }

  async getTxAmount() {
    if (await this.txDetailBlock.isVisible()) {
      return await this.txDetailAmount.textContent();
    }
    return null;
  }
}
