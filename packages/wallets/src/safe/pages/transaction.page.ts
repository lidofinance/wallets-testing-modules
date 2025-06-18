import { Locator, Page, test, expect } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';
import { WalletPage } from '../../wallet.page';
import { WalletConnectTypes } from '../../wallets.constants';
import { Big } from 'big.js';

export class TransactionPage {
  logger = new ConsoleLogger(`Safe. ${TransactionPage.name}`);
  transactionCardContent: Locator;
  contractExplorerUrl: Locator;
  tokenAmount: Locator;
  executeTxBtn: Locator;
  finishTxBtn: Locator;
  switchNetworkBtn: Locator;

  allActionsList: Locator;
  actionItem: Locator;
  contentLoader: Locator;
  transactionFailBanner: Locator;

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
    this.allActionsList = this.page.getByTestId('all-actions');
    this.actionItem = this.page.getByTestId('action-item');
    this.contentLoader = this.page.locator('#gooey').locator('../../..');
    this.transactionFailBanner = this.page.getByText(
      'This transaction will most likely fail.',
    );
  }

  async assertsContractOfTransaction(expectedAddress: string) {
    await this.waitForLoaderToBeHidden();
    await this.failTestIfSafeDisplayFailBanner();

    let isNeedToCheckAllActions = false;
    try {
      await this.allActionsList.waitFor({ timeout: 3000, state: 'visible' });
      isNeedToCheckAllActions = true;
    } catch {
      const contractExplorerUrl = await this.contractExplorerUrl.getAttribute(
        'href',
      );
      const match = contractExplorerUrl.match(/address\/([^/\s]+)/);
      expect(match[1]).toEqual(expectedAddress);
    }

    if (isNeedToCheckAllActions) {
      const actions = await this.actionItem.all();
      for (const action of actions) {
        await test.step(`Check address of "${await action.textContent()}" action`, async () => {
          if ((await action.getAttribute('aria-expanded')) === 'false') {
            await action.click();
          }
          const actionInfo = action.locator('../..');
          const contractsUrls = await actionInfo
            .getByTestId('explorer-btn')
            .all();
          const contractExplorerUrl = await contractsUrls[
            contractsUrls.length - 1
          ].getAttribute('href');

          const match = contractExplorerUrl.match(/address\/([^/\s]+)/);
          expect(match[1]).toEqual(expectedAddress);
        });
      }
    }
  }

  async confirmTransaction() {
    await this.waitForLoaderToBeHidden();
    await this.failTestIfSafeDisplayFailBanner();

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

  async assertTransactionAmount(expectedAmount: string) {
    await this.waitForLoaderToBeHidden();
    await this.failTestIfSafeDisplayFailBanner();

    let isNeedToCheckAllActions = false;
    try {
      await this.allActionsList.waitFor({ timeout: 5000, state: 'visible' });
      isNeedToCheckAllActions = true;
    } catch {
      expect(await this.tokenAmount.textContent()).toEqual(expectedAmount);
    }

    if (isNeedToCheckAllActions) {
      const actions = await this.actionItem.all();
      for (const action of actions) {
        await test.step(`Check amount of "${await action.textContent()}" action`, async () => {
          if ((await action.getAttribute('aria-expanded')) === 'false') {
            await action.click();
          }
          let actionInfo = action.locator('../..');
          const actionParameters = await actionInfo
            .getByTestId('tx-row-title')
            .all();

          if (actionParameters.length > 1) {
            actionInfo = actionInfo
              .locator('[data-testid="tx-row-title"]:has-text("value")')
              .locator('..');
          }

          const valueParam = await actionInfo
            .getByTestId('tx-data-row')
            .textContent();

          expect(String(new Big(valueParam).div(1e18))).toEqual(expectedAmount);
        });
      }
    }
  }

  private async waitForLoaderToBeHidden() {
    await test.step('Waiting for loader to be hidden', async () => {
      try {
        await this.contentLoader.waitFor({ timeout: 5000, state: 'visible' });
      } catch {
        return;
      }
      await this.contentLoader.waitFor({ timeout: 30000, state: 'hidden' });
    });
  }

  private async failTestIfSafeDisplayFailBanner() {
    try {
      await this.transactionFailBanner.waitFor({
        timeout: 2000,
        state: 'visible',
      });
      this.logger.error(
        "Interrupting the test process if safe can't realize transaction and display fail banner",
      );
      await expect(this.transactionFailBanner).not.toBeVisible();
    } catch {
      // Transaction fail banner is not visible
    }
  }
}
