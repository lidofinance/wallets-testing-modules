import { Page } from '@playwright/test';
import { NetworkConfig, WalletConfig } from './wallets.constants';

export interface WalletPage {
  page: Page | undefined;
  config: WalletConfig;

  setup(network?: string): Promise<void>;

  importKey(key: string): Promise<void>;

  connectWallet(page: Page): Promise<void>;

  assertTxAmount(page: Page, expectedAmount: string): Promise<void>;

  confirmTx(page: Page, setAggressiveGas?: boolean): Promise<void>;

  cancelTx?(page: Page): Promise<void>;

  approveTokenTx?(page: Page): Promise<void>;

  openLastTxInEthplorer?(txIndex?: number): Promise<Page>;

  getTokenBalance?(tokenName: string): Promise<number>;

  confirmAddTokenToWallet?(page: Page): Promise<void>;

  assertReceiptAddress(page: Page, expectedAmount: string): Promise<void>;

  getWalletAddress?(): Promise<string>;

  setupNetwork?(standConfig: Record<string, any>): Promise<void>;

  addNetwork(
    networkConfig: NetworkConfig,
    isClosePage?: boolean,
  ): Promise<void>;

  changeNetwork?(networkName: string): Promise<void>;

  changeWalletAccountByName?(accountName: string): Promise<void>;
  changeWalletAccountByAddress?(address: string): Promise<void>;
  isWalletAddressExist?(address: string): Promise<boolean>;
}
