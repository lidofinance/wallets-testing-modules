import { Page } from '@playwright/test';
import { NetworkConfig, WalletConfig, WalletType } from '../wallets.constants';

/** This interface describes the EOA wallets (_like Metamask, OKX, Trust etc._)
 * and lets to manage these wallets with included methods*/
export interface WalletPage<T extends WalletType> {
  page: Page | undefined;
  config: WalletConfig;

  setup(network?: string): Promise<void>;

  importKey(key: string): Promise<void>;

  connectWallet(param: T extends 'EOA' ? Page : string): Promise<void>;

  assertTxAmount(page: Page, expectedAmount: string): Promise<void>;

  confirmTx(page: Page, setAggressiveGas?: boolean): Promise<void>;

  cancelTx?(page: Page): Promise<void>;

  approveTokenTx?(page: Page): Promise<void>;

  openLastTxInEthplorer?(txIndex?: number): Promise<Page>;

  getTokenBalance?(tokenName: string): Promise<number>;

  confirmAddTokenToWallet?(page: Page): Promise<void>;

  assertReceiptAddress(page: Page, expectedAmount: string): Promise<void>;

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
