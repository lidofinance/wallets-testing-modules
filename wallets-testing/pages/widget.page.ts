import { Locator, Page } from '@playwright/test';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';
import { WidgetConfig } from '../config';

export interface WidgetPage {
  page: Page;
  walletPage: WalletPage<any>;
  widgetConfig: WidgetConfig;

  connectBtn: Locator;
  stakeInput: Locator;
  stakeSubmitBtn: Locator;
  enabledStakeSubmitBtn: Locator;

  headerAccountSection: Locator;
  providerName: Locator;
  ethAvailableToStakeValue: Locator;
  termsCheckbox: Locator;
  copyWcUrlBtn: Locator;
  closeAccountModalBtn: Locator;

  goto?(path?: string): Promise<void>;

  connectWallet(): Promise<void>;

  stake(txAmount: string): Promise<void>;

  wrapStETH?(txAmount: string): Promise<void>;

  getWalletButtonByName?(walletButtonName: string): Promise<Locator>;

  waitForPage(timeout?: number): Promise<Page>;

  closeAccountModal(): Promise<void>;
}
