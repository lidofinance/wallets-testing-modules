import { Page } from '@playwright/test';
import {
  AccountConfig,
  CommonWalletConfig,
  NetworkConfig,
  WalletType,
  WalletTypes,
} from './wallets.constants';

/** - T -> WalletTypes.EOA describes the EOA wallets (_like Metamask, OKX, Trust etc._)
 * and lets to manage these wallets with included methods
 * - T -> WalletTypes.WC describes the connection with WalletConnect wallet (_like Safe etc._)
 * and lets to manage these wallets with included methods*/
export interface WalletPage<T extends WalletType> {
  page: Page | undefined;
  accountConfig: AccountConfig;
  walletConfig: CommonWalletConfig;

  setup(): Promise<void>;

  importKey(key: string): Promise<void>;

  connectWallet(
    param: T extends WalletTypes.EOA ? Page : string,
  ): Promise<void>;

  assertTxAmount(page: Page, expectedAmount: string): Promise<void>;

  confirmTx(page: Page, setAggressiveGas?: boolean): Promise<void>;

  cancelTx(page: Page): Promise<void>;

  approveTokenTx?(page: Page): Promise<void>;

  openLastTxInEthplorer?(txIndex?: number): Promise<Page>;

  getTokenBalance?(tokenName: string): Promise<number>;

  confirmAddTokenToWallet?(page: Page): Promise<void>;

  assertReceiptAddress(page: Page, expectedAddress: string): Promise<void>;

  getWalletAddress?(): Promise<string>;

  setupNetwork?(networkConfig: NetworkConfig): Promise<void>;

  addNetwork(
    networkConfig: NetworkConfig,
    isClosePage?: boolean,
  ): Promise<void>;

  changeNetwork?(networkName: string): Promise<void>;

  changeWalletAccountByName?(accountName: string): Promise<void>;
  changeWalletAccountByAddress?(address: string): Promise<void>;
  isWalletAddressExist?(address: string): Promise<boolean>;
}
