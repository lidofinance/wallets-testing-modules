import { Locator, Page, test } from '@playwright/test';

export class WalletOperationPage {
  page: Page;
  nextButton: Locator;
  confirmButton: Locator;
  rejectButton: Locator;
  cancelButton: Locator;
  addTokenButton: Locator;
  editGasFeeButton: Locator;
  setHighGasFeeButton: Locator;
  scrollRequestSignatureBlockButton: Locator;
  rejectAllTxsButton: Locator;
  confirmRejectAllTxsButton: Locator;
  recipientButton: Locator;
  recipientAddress: Locator;
  popoverCloseButton: Locator;
  txDetailBlock: Locator;
  txDetailAmount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nextButton = this.page.getByTestId('page-container-footer-next');
    this.confirmButton = this.page.getByTestId('confirm-footer-button');
    this.rejectButton = this.page.getByTestId('page-container-footer-cancel');
    this.cancelButton = this.page.getByTestId('confirm-footer-cancel-button');
    this.addTokenButton = this.page.locator('button:has-text("Add token")');
    this.editGasFeeButton = this.page.getByTestId('edit-gas-fee-icon');
    this.setHighGasFeeButton = this.page.getByTestId('edit-gas-fee-item-high');
    this.scrollRequestSignatureBlockButton = this.page.getByTestId(
      'signature-request-scroll-button',
    );
    this.rejectAllTxsButton = this.page.locator(
      'div[class="page-container__footer-secondary"]',
    );
    this.confirmRejectAllTxsButton = this.page.locator(
      'button:has-text("Reject all")',
    );
    this.recipientButton = this.page
      .getByTestId('transaction-details-recipient-row')
      .locator('.name');
    this.recipientAddress = this.page.locator('input[id="address"]');
    this.popoverCloseButton = this.page.locator('button[aria-label="Close"]');
    this.txDetailBlock = this.page.getByTestId('simulation-details-layout');
    this.txDetailAmount = this.txDetailBlock.getByTestId(
      'simulation-details-amount-pill',
    );
  }

  async rejectAllTxInQueue() {
    //Is there is any tx in queue.
    try {
      await this.rejectButton.waitFor({
        state: 'visible',
        timeout: 1000,
      });
    } catch (er) {
      return;
    }

    if (await this.rejectAllTxsButton.isVisible()) {
      await this.rejectAllTxsButton.click();
      await this.confirmRejectAllTxsButton.click();
    } else {
      await this.rejectButton.click();
    }
  }

  async rejectTransaction() {
    await this.rejectButton.click();
  }

  async cancelSignTransaction() {
    await this.cancelButton.click();
  }

  async signTransaction() {
    await this.confirmButton.click();
  }

  async confirmTransactionOfTokenApproval() {
    await test.step('Click "Use default" button in case if it exist', async () => {
      // todo: im not sure this step is needed now
      if (await this.page.locator('text=Use default').isVisible())
        await this.page.click('text=Use default');
    });
    await this.nextButton.click(); // click to the Next button
    await this.page.waitForTimeout(2000);
    await this.nextButton.click(); // click to the Approve button
  }

  async confirmTransaction(setAggressiveGas?: boolean) {
    if (setAggressiveGas) {
      await this.editGasFeeButton.click();
      await this.page.mouse.move(1, 1);
      await this.setHighGasFeeButton.click();
    }
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
