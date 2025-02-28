import { Page } from '@playwright/test';
import {
  WalletConnectPage,
  WalletPage,
} from '@lidofinance/wallets-testing-wallets';

export interface WidgetPage {
  page: Page | undefined;

  navigate(): Promise<void>;

  connectWallet(
    walletPage: WalletPage,
    additionalWallet?: WalletConnectPage,
  ): Promise<void>;

  doStaking(walletPage: WalletPage): Promise<void>;
}
