import { Page } from 'playwright';
import { WalletPage } from '@lidofinance/wallets-testing-wallets';

export interface WidgetPage {
  page: Page | undefined;

  navigate(): Promise<void>;

  connectWallet(walletPage: WalletPage): Promise<void>;

  doStaking(walletPage: WalletPage): Promise<void>;
}
