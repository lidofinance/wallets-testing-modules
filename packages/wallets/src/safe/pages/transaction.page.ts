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
  continueTxBtn: Locator;
  executeTxBtn: Locator;
  comboSubmitDropdown: Locator;
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
    this.continueTxBtn = this.page.getByTestId('continue-sign-btn');
    this.executeTxBtn = this.page
      .getByTestId('execute-form-btn')
      .or(this.page.getByTestId('combo-submit-execute'));
    this.comboSubmitDropdown = this.page.getByTestId('combo-submit-dropdown');
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
      // If only Execution action (without approval)
      const contractExplorerUrl = await this.contractExplorerUrl.getAttribute(
        'href',
      );
      const match = contractExplorerUrl.match(/address\/([^/\s]+)/);
      expect(match[1]).toEqual(expectedAddress);
    }

    // If the tx has 2 actions (Approval and Execution)
    if (isNeedToCheckAllActions) {
      const actions = await this.actionItem.all();
      expect(actions.length, 'Approve and Execution transactions').toBe(2);
      const approveAction = actions[0];
      const txAction = actions[1];

      await test.step('Check address of Approve action', async () => {
        if ((await approveAction.getAttribute('aria-expanded')) === 'false') {
          await approveAction.click();
        }

        const actionInfo = approveAction
          .locator('../..')
          .locator('[data-testid="tx-row-title"]:has-text("spender")')
          .locator('..');
        const contractsUrls = await actionInfo
          .getByTestId('explorer-btn')
          .all();
        const contractExplorerUrl = await contractsUrls[
          contractsUrls.length - 1
        ].getAttribute('href');

        const match = contractExplorerUrl.match(/address\/([^/\s]+)/);
        expect(match[1]).toEqual(expectedAddress);
      });

      await test.step('Check address of the Execution action', async () => {
        if ((await txAction.getAttribute('aria-expanded')) === 'false') {
          await txAction.click();
        }
        const actionInfo = txAction.locator('../..');
        const contractExplorerUrl = await actionInfo
          .getByTestId('explorer-btn')
          .first()
          .getAttribute('href');

        const match = contractExplorerUrl.match(/address\/([^/\s]+)/);
        expect(match[1]).toEqual(expectedAddress);
      });
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

    // we need to do some steps depending on the UI displays
    await test.step('Prepare the Safe Tx page for the transaction execution', async () => {
      const result = await Promise.race([
        this.executeTxBtn
          .waitFor({ timeout: 5000, state: 'visible' })
          .then(() => 'execute'),
        this.continueTxBtn
          .waitFor({ timeout: 5000, state: 'visible' })
          .then(() => 'continue'),
        this.comboSubmitDropdown
          .waitFor({ timeout: 5000, state: 'visible' })
          .then(() => 'dropdown'),
      ]);

      if (result == 'continue') await this.continueTxBtn.click();
      if (result == 'continue' || result == 'dropdown')
        await this.selectOptionToExecuteTx();
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
      // Sometimes the tx execution fails, and we need to try to execute the tx several times
      // It helps us to avoid fail of test with the tx execution
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
          this.logger.warn(`[Attempt ${attempt}]`);
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
      // continue
    }

    // If only Execution action (without approval)
    if (!isNeedToCheckAllActions) {
      if (await this.tokenAmount.count()) {
        expect(await this.tokenAmount.textContent()).toEqual(expectedAmount);
      } else {
        // unwrap tx - the only one execution action, but the tx amount displayed in the actions lists
        const valueParam = await this.page
          .getByTestId('tx-data-row')
          .textContent();
        expect(String(new Big(valueParam).div(1e18))).toEqual(expectedAmount);
      }
    }

    // If the tx has 2 actions (Approval and Execution)
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
              .locator(
                '[data-testid="tx-row-title"] :text-matches("value|amount")',
              )
              .locator('../../../..');
          }

          const txAmountValue = parseFloat(
            (await actionInfo.getByTestId('tx-data-row').textContent()).replace(
              /[[\]]/g,
              '',
            ),
          );

          // Safe UI displays the BigInt type of tx value (100000000000), and we need to convert to before matching
          expect(String(new Big(txAmountValue).div(1e18))).toEqual(
            expectedAmount,
          );
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

  // If Safe UI get problems with rpc or current tx, it displays the warning banner
  // It means the tx will not be completed
  // So we interrupt the test to avoid long downtime
  private async failTestIfSafeDisplayFailBanner() {
    let needToInterruptTest = false;
    try {
      await this.transactionFailBanner.waitFor({
        timeout: 2000,
        state: 'visible',
      });
      needToInterruptTest = true;
    } catch {
      // Transaction fail banner is not visible
    }

    if (needToInterruptTest) {
      this.logger.error(
        "Interrupting the test process because safe can't realize transaction and display fail banner",
      );
      await expect(this.transactionFailBanner).not.toBeVisible();
    }
  }

  private async selectOptionToExecuteTx() {
    await this.comboSubmitDropdown.click();
    await this.page
      .getByTestId('combo-submit-popover')
      .getByText('Execute')
      .click();
  }
}
