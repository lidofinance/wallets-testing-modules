import { Page } from '@playwright/test';
import { WalletPage, WalletType } from '@lidofinance/wallets-testing-wallets';

export interface WidgetPage {
  page: Page | undefined;

  navigate(): Promise<void>;

  connectWallet(walletPage: WalletPage<WalletType>): Promise<void>;

  doStaking(walletPage: WalletPage<WalletType>): Promise<void>;
}
