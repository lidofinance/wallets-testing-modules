import { Page } from 'playwright';
import { WalletConfig } from './wallets.constants';

export interface WalletPage {
  page: Page | undefined;
  config: WalletConfig;

  setup(): Promise<void>;

  importKey(key: string): Promise<void>;

  connectWallet(page: Page): Promise<void>;

  assertTxAmount(page: Page, expectedAmount: string): Promise<void>;

  confirmTx(page: Page): Promise<void>;

  assertReceiptAddress(page: Page, expectedAmount: string): Promise<void>;
}
