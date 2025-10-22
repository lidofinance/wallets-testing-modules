import { Locator, Page } from '@playwright/test';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';
import { WidgetConfig } from '../config';

export enum tokenToWrap {
  ETH = 'ETH',
  stETH = 'stETH',
}

export enum tokenToWithdraw {
  stETH = 'stETH',
  wstETH = 'wstETH',
}

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
  copyWcUrlBtn?: Locator; // EOA, WC+Safe
  closeModalBtn: Locator;

  goto?(path?: string): Promise<void>;

  connectWallet(): Promise<void>;

  stake(txAmount: string): Promise<void>;

  wrap?(txAmount: string, token: tokenToWrap): Promise<void>;

  unwrap?(txAmount: string): Promise<void>;

  request?(txAmount: string, token: tokenToWithdraw): Promise<void>;

  claim?(): Promise<void>;

  getWalletButtonByName?(walletButtonName: string): Promise<Locator>;

  waitForPage(timeout?: number): Promise<Page>;

  closeModal(): Promise<void>;
}
