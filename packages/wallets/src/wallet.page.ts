import { BrowserContext, Page } from '@playwright/test';
import {
  AccountConfig,
  CommonWalletConfig,
  NetworkConfig,
  StandConfig,
  WalletConnectType,
  WalletConnectTypes,
} from './wallets.constants';

/** Required options to manage wallet */
export interface WalletPageOptions {
  browserContext: BrowserContext;
  accountConfig?: AccountConfig;
  walletConfig?: CommonWalletConfig;
  extensionUrl?: string;
  extensionPage?: WalletPage<WalletConnectTypes.EOA>;
  standConfig?: StandConfig;
}

/** **T -> WalletConnectTypes.EOA**
 * - describes the EOA wallets (_Metamask, OKX, Trust, BitGet, Coin98, Coinbase, Ctrl, Exodus._) and lets to manage these wallets with included methods
 * - required options:
 *   - browserContext
 *   - extensionUrl
 *   - accountConfig
 *   - walletConfig
 *
 *  **T -> WalletConnectTypes.WC**
 * - describes the connection with WalletConnect wallet (_Safe_) and lets to manage these wallets with included methods
 * - required options:
 *   - browserContext
 *   - extensionPage
 *   - walletConfig
 *   - stand
 *
 * **T -> WalletConnectTypes.IFRAME**
 * - describes the opening the Lido ETH Widget in the iframe app of the wallet (_Safe iframe._) and lets to manage these wallets with included methods
 * - required options:
 *   - browserContext
 *   - extensionPage
 *   - walletConfig
 *   - stand
 * */
export interface WalletPage<T extends WalletConnectType> {
  options: WalletPageOptions;
  page?: Page;

  setup(): Promise<void>;

  importKey(key: string): Promise<void>;

  connectWallet(
    param?: T extends WalletConnectTypes.EOA ? Page : string,
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

  changeWalletAccountByName?(
    accountName: string,
    isClosePage?: boolean,
  ): Promise<void>;
  changeWalletAccountByAddress?(
    address: string,
    isClosePage?: boolean,
  ): Promise<void>;
  isWalletAddressExist?(address: string): Promise<boolean>;
}
