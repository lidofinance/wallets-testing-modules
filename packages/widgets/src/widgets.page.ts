import { Page } from '@playwright/test';
import { WalletPage, WalletTypes } from '@lidofinance/wallets-testing-wallets';

export interface WidgetPage {
  page: Page | undefined;

  navigate(): Promise<void>;

  connectWallet(
    extensionWallet: WalletPage<WalletTypes.EOA>,
    wcImplementedWallet?: WalletPage<WalletTypes.WC>,
  ): Promise<void>;

  doStaking(walletPage: WalletPage<WalletTypes.EOA>): Promise<void>;
}
