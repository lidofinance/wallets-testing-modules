import { expect, FrameLocator, Locator, Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';
import { BrowserService } from '@lidofinance/browser-service';
import { tokenToWithdraw, tokenToWrap, WidgetPage } from './widget.page';
import { WidgetConfig } from '../config';

export class IframeWidgetPage implements WidgetPage {
  logger = new ConsoleLogger(IframeWidgetPage.name);
  walletPage: WalletPage;
  app: FrameLocator;
  page: Page;

  wrapTabBtn: Locator;
  unwrapSwitcherBtn: Locator;
  withdrawTabBtn: Locator;
  claimSwitcherBtn: Locator;

  connectBtn: Locator;
  stakeInput: Locator;
  stakeSubmitBtn: Locator;
  enabledStakeSubmitBtn: Locator;

  headerAccountSection: Locator;
  providerName: Locator;
  ethAvailableToStakeValue: Locator;
  termsCheckbox: Locator;
  copyWcUrlBtn: Locator;
  closeModalBtn: Locator;
  tokenDropDown: Locator;

  wrapInput: Locator;
  wrapSubmitBtn: Locator;
  enabledWrapSubmitBtn: Locator;

  unwrapInput: Locator;
  unwrapSubmitBtn: Locator;
  enabledUnwrapSubmitBtn: Locator;

  requestInput: Locator;
  requestSubmitBtn: Locator;
  enabledRequestBtn: Locator;

  rdyToClaimCount: Locator;
  claimList: Locator;
  rdyToClaimCheckboxes: Locator;
  claimSubmitBtn: Locator;

  constructor(
    browserService: BrowserService,
    public widgetConfig: WidgetConfig,
  ) {
    this.walletPage = browserService.getWalletPage();
    this.page = browserService.getBrowserContextPage();
    this.app = this.page.locator('iframe').first().contentFrame();

    this.wrapTabBtn = this.app.getByTestId('navWrap');
    this.unwrapSwitcherBtn = this.app.getByTestId('Unwrap-switch');
    this.withdrawTabBtn = this.app.getByTestId('navWithdrawals');
    this.claimSwitcherBtn = this.app.getByTestId('Claim-switch');

    this.connectBtn = this.app
      .getByRole('button')
      .getByText('Connect', { exact: true });
    this.stakeInput = this.app.getByTestId('stakeInput');
    this.stakeSubmitBtn = this.app.getByTestId('stakeSubmitBtn');
    this.enabledStakeSubmitBtn = this.app.locator(
      'button[data-testid="stakeSubmitBtn"]:not([disabled])',
    );

    this.headerAccountSection = this.app.getByTestId('accountSectionHeader');
    this.providerName = this.app.locator('div[data-testid="providerName"]');
    this.ethAvailableToStakeValue = this.app.getByTestId('ethAvailableToStake');
    this.termsCheckbox = this.app.getByRole('checkbox');
    this.closeModalBtn = this.app.locator('div[role="dialog"] button').nth(0);

    this.wrapInput = this.app.getByTestId('wrapInput');
    this.tokenDropDown = this.app.getByTestId('drop-down').locator('../..');
    this.wrapSubmitBtn = this.app.getByTestId('wrapBtn');
    this.enabledWrapSubmitBtn = this.app.locator(
      'button[data-testid="wrapBtn"]:not([disabled])',
    );

    this.unwrapInput = this.app.getByTestId('unwrapInput');
    this.unwrapSubmitBtn = this.app.getByTestId('unwrapSubmitBtn');
    this.enabledUnwrapSubmitBtn = this.app.locator(
      'button[data-testid="unwrapSubmitBtn"]:not([disabled])',
    );

    this.requestInput = this.app.getByTestId('requestInput');
    this.requestSubmitBtn = this.app.getByTestId('requestButton');
    this.enabledRequestBtn = this.app.locator(
      'button[data-testid="requestButton"]:not([disabled])',
    );

    this.rdyToClaimCount = this.app.getByTestId('rdyToClaimCount');
    this.claimList = this.app.getByTestId('claimList');
    this.rdyToClaimCheckboxes = this.claimList.getByTestId('requestCheckbox');
    this.claimSubmitBtn = this.app.getByTestId('claimButton');
  }

  async connectWallet() {
    return await test.step('Connect wallet to Lido app in Safe', async () => {
      const attemptsToConnect = 3;
      for (let attempt = 1; attempt <= attemptsToConnect; attempt++) {
        await this.walletPage.connectWallet();
        await this.waitForWidgetLoaded();
        try {
          await this.connectBtn.waitFor({
            timeout: 2000,
            state: 'visible',
          });

          await test.step('Connect wallet', async () => {
            await this.clickToTermsCheckbox();
            await this.connectBtn.click({ timeout: 5000 });
          });

          if (await this.app.getByText('timed out').isVisible()) {
            this.logger.warn(
              `[Attempt ${attempt}] Error with connect Safe to Widget (err="timed out")`,
            );
            continue;
          }
        } catch {
          this.logger.log('No need to connect wallet');
        }
        return;
      }

      this.logger.error(
        'Interrupting the test process because safe is not connected',
      );
      await expect(this.connectBtn).not.toBeVisible();
    });
  }

  async stake(txAmount: string) {
    await test.step('Fill input', async () => {
      await this.stakeInput.fill(txAmount);
      await this.enabledStakeSubmitBtn.waitFor({ timeout: 15000 });
    });

    await test.step('Click to staking button', async () => {
      await this.page.waitForTimeout(2000); // without awaiting the safe can't to calculate gas cost for tx sometimes
      await this.stakeSubmitBtn.click();
    });

    await this.walletPage.assertTxAmount(txAmount);
    await this.walletPage.assertReceiptAddress(this.widgetConfig.stakeContract);

    // Skip next steps, because on the mainnet we need to check only tx initialization (without execution)
    if (this.widgetConfig.network.chainId == 1) return;

    await this.walletPage.confirmTx(true);
    await this.app
      .getByText('Staking operation was successful.')
      .waitFor({ state: 'visible', timeout: 90000 });
  }

  async wrap(txAmount: string, token: tokenToWrap) {
    await test.step('Open Wrap tab', async () => {
      await this.wrapTabBtn.click();
    });

    await test.step(`Select ${token} token to wrap`, async () => {
      await this.tokenDropDown.click();
      await this.app.getByTestId(token).click();
    });

    await test.step('Fill input', async () => {
      await this.wrapInput.fill(txAmount);
      await this.enabledWrapSubmitBtn.waitFor({ timeout: 15000 });
    });

    await test.step('Click to wrapping button', async () => {
      await this.page.waitForTimeout(2000); // without awaiting the safe can't to calculate gas cost for tx sometimes
      await this.wrapSubmitBtn.click();
    });

    await this.walletPage.assertTxAmount(txAmount);
    await this.walletPage.assertReceiptAddress(
      this.widgetConfig.wrapContract[token],
    );

    // Skip next steps, because on the mainnet we need to check only tx initialization (without execution)
    if (this.widgetConfig.network.chainId == 1) return;

    await this.walletPage.confirmTx(true);
    await this.app
      .getByText('Wrapping operation was successful.')
      .waitFor({ state: 'visible', timeout: 90000 });
  }

  async unwrap(txAmount: string) {
    await test.step('Open Unwrap tab', async () => {
      await this.wrapTabBtn.click();
      await this.unwrapSwitcherBtn.click();
    });

    await test.step('Fill input', async () => {
      await this.unwrapInput.fill(txAmount);
      await this.enabledUnwrapSubmitBtn.waitFor({ timeout: 15000 });
    });

    await test.step('Click to unwrapping button', async () => {
      await this.page.waitForTimeout(2000); // without awaiting the safe can't to calculate gas cost for tx sometimes
      await this.unwrapSubmitBtn.click();
    });

    await this.walletPage.assertTxAmount(txAmount);
    await this.walletPage.assertReceiptAddress(
      this.widgetConfig.wrapContract.stETH,
    );

    // Skip next steps, because on the mainnet we need to check only tx initialization (without execution)
    if (this.widgetConfig.network.chainId == 1) return;

    await this.walletPage.confirmTx(true);
    await this.app
      .getByText('Unwrapping operation was successful.')
      .waitFor({ state: 'visible', timeout: 90000 });
  }

  async request(txAmount: string, token: tokenToWithdraw) {
    await test.step('Open Withdrawal request tab', async () => {
      await this.withdrawTabBtn.click();
    });

    await test.step(`Select ${token} token to withdraw`, async () => {
      await this.tokenDropDown.click();
      await this.app.getByTestId(token).click();
    });

    await test.step('Fill input', async () => {
      await this.requestInput.fill(txAmount);
      await this.enabledRequestBtn.waitFor({ timeout: 15000 });
    });

    await test.step('Click to withdrawal button', async () => {
      await this.page.waitForTimeout(2000); // without awaiting the safe can't to calculate gas cost for tx sometimes
      await this.requestSubmitBtn.click();
    });

    await this.walletPage.assertTxAmount(txAmount);
    await this.walletPage.assertReceiptAddress(
      this.widgetConfig.withdrawalContract,
    );

    // Skip next steps, because on the mainnet we need to check only tx initialization (without execution)
    if (this.widgetConfig.network.chainId == 1) return;

    await this.walletPage.confirmTx(true);
    await this.app
      .getByText('Withdrawal request successfully sent')
      .waitFor({ state: 'visible', timeout: 90000 });
  }

  async claim() {
    await test.step('Open Claim tab', async () => {
      await this.withdrawTabBtn.click();
      await this.claimSwitcherBtn.click();
    });

    const rdyToClaim = Number(await this.rdyToClaimCount.textContent());
    await test.step('Check the count of Ready to claim requests', async () => {
      test.skip(
        rdyToClaim < 1,
        'Skip the test if no one request is ready to claim',
      );
    });

    await test.step('Choose request for claiming', async () => {
      await this.uncheckAllClaimRequests();
      await this.rdyToClaimCheckboxes.first().locator('..').click();
    });

    await test.step('Click to Claim submit button', async () => {
      await this.claimSubmitBtn.click();
    });

    await this.walletPage.assertReceiptAddress(
      this.widgetConfig.withdrawalContract,
    );

    // Skip next steps, because on the mainnet we need to check only tx initialization (without execution)
    if (this.widgetConfig.network.chainId == 1) return;

    await this.walletPage.confirmTx(true);
    await this.app
      .getByText('Claiming operation was successful')
      .waitFor({ state: 'visible', timeout: 90000 });

    await test.step('Check the count of ready to claim requests', async () => {
      await this.closeModal();
      const updRdyToClaim = Number(await this.rdyToClaimCount.textContent());
      expect(
        updRdyToClaim,
        `The rdyToClaim requests count (${rdyToClaim}) should be reduced after successful tx (${updRdyToClaim})`,
      ).toBe(rdyToClaim - 1);
    });
  }

  async waitForPage(timeout?: number) {
    return this.page.context().waitForEvent('page', { timeout: timeout });
  }

  async closeModal() {
    await this.closeModalBtn.click();
  }

  private async clickToTermsCheckbox() {
    if (!(await this.termsCheckbox.isChecked())) {
      await this.termsCheckbox.locator('..').click();
    }
  }

  private async waitForWidgetLoaded() {
    await this.app
      .getByText('Stake Ether')
      .waitFor({ timeout: 15000, state: 'visible' });
  }

  private async uncheckAllClaimRequests() {
    await test.step('Uncheck all claim requests', async () => {
      await this.rdyToClaimCheckboxes.first().waitFor({ state: 'attached' });
      await this.rdyToClaimCheckboxes.evaluateAll(async (checkboxes) => {
        for (const checkbox of checkboxes) {
          const input = checkbox as HTMLInputElement;
          if (input.checked) {
            input.click();
          }
        }
      });
    });
  }
}
