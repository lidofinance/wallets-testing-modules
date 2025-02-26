import { Page } from '@playwright/test';
import {
  AdditionalWalletPage,
  WalletPage,
} from '@lidofinance/wallets-testing-wallets';

export interface WidgetPage {
  page: Page | undefined;

  navigate(): Promise<void>;

  connectWallet(
    walletPage: WalletPage,
    additionalWallet?: AdditionalWalletPage,
  ): Promise<void>;

  doStaking(walletPage: WalletPage): Promise<void>;
}
