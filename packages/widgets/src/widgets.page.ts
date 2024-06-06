import { Page } from '@playwright/test';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';

export interface WidgetPage {
  page: Page | undefined;

  navigate(): Promise<void>;

  connectWallet(walletPage: WalletPage): Promise<void>;

  doStaking(walletPage: WalletPage): Promise<void>;
}
