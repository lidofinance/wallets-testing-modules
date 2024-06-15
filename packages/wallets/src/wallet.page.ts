import { Page } from '@playwright/test';
import { WalletConfig } from './wallets.constants';

export interface WalletPage {
  page: Page | undefined;
  config: WalletConfig;

  setup(network?: string): Promise<void>;

  importKey(key: string): Promise<void>;

  connectWallet(page: Page): Promise<void>;

  assertTxAmount(page: Page, expectedAmount: string): Promise<void>;

  confirmTx(page: Page, setAggressiveGas?: boolean): Promise<void>;

  signTx(page: Page): Promise<void>;

  rejectTx?(page: Page): Promise<void>;

  approveTokenTx?(page: Page): Promise<void>;

  openLastTxInEthplorer?(txIndex?: number): Promise<Page>;

  getTokenBalance?(tokenName: string): Promise<number>;

  confirmAddTokenToWallet?(page: Page): Promise<void>;

  assertReceiptAddress(page: Page, expectedAmount: string): Promise<void>;

  getWalletAddress?(): Promise<string>;

  setupNetwork?(standConfig: Record<string, any>): Promise<void>;

  addNetwork(
    networkName: string,
    networkUrl: string,
    chainId: number,
    tokenSymbol: string,
    blockExplorer?: string,
  ): Promise<void>;

  changeNetwork?(networkName: string): Promise<void>;

  changeWalletAddress?(addressNumber: number): Promise<void>;
}
