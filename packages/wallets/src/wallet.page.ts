import { BrowserContext, Page } from '@playwright/test';
import {
  AccountConfig,
  CommonWalletConfig,
  NetworkConfig,
  StandConfig,
  WalletConnectType,
  WalletConnectTypes,
} from './wallets.constants';
import { WCSessionRequest } from './walletConnect/components';

/** Required options to manage wallet */
export interface WalletPageOptions {
  browserContext: BrowserContext;
  walletConfig: CommonWalletConfig;
  accountConfig?: AccountConfig;
  extensionUrl?: string;
  extensionPage?: WalletPage<WalletConnectTypes.EOA>;
  standConfig?: StandConfig;
}

/** **T -> WalletConnectTypes.EOA**
 * - describes the EOA wallets (_Metamask, OKX, Trust, BitGet, Coin98, Coinbase, Ctrl, Exodus._) and lets to manage these wallets with included methods
 * - required options:
 *   - browserContext
 *   - walletConfig
 *   - extensionUrl
 *   - accountConfig
 *
 *  **T -> WalletConnectTypes.WC**
 * - describes the connection with WalletConnect wallet (_Safe_) and lets to manage these wallets with included methods
 * - required options:
 *   - browserContext
 *   - walletConfig
 *   - extensionPage
 *   - standConfig
 *
 * **T -> WalletConnectTypes.IFRAME**
 * - describes the opening the Lido ETH Widget in the iframe app of the wallet (_Safe iframe._) and lets to manage these wallets with included methods
 * - required options:
 *   - browserContext
 *   - walletConfig
 *   - extensionPage
 *   - standConfig
 * */
export interface WalletPage<T extends WalletConnectType> {
  options: WalletPageOptions;
  page?: Page;

  setup(): Promise<void>;

  importKey(secretKey: string, withChecks?: boolean): Promise<void>;

  connectWallet(
    param?: T extends WalletConnectTypes.EOA ? Page : string,
  ): Promise<void>;

  assertTxAmount(
    page: T extends WalletConnectTypes.WC_SDK ? WCSessionRequest : Page,
    expectedAmount: string,
  ): Promise<void> | void;

  confirmTx(
    page: T extends WalletConnectTypes.WC_SDK ? WCSessionRequest : Page,
    setAggressiveGas?: boolean,
  ): Promise<void>;

  cancelTx(
    page: T extends WalletConnectTypes.WC_SDK ? WCSessionRequest : Page,
  ): Promise<void>;

  approveTokenTx?(
    page: T extends WalletConnectTypes.WC_SDK ? WCSessionRequest : Page,
  ): Promise<void>;

  openLastTxInEthplorer?(txIndex?: number): Promise<Page>;

  getTokenBalance?(tokenName: string): Promise<number>;

  confirmAddTokenToWallet?(
    page: T extends WalletConnectTypes.WC_SDK ? WCSessionRequest : Page,
  ): Promise<void>;

  assertReceiptAddress(
    page: T extends WalletConnectTypes.WC_SDK ? WCSessionRequest : Page,
    expectedAddress: string,
  ): Promise<void> | void;

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

  // WC SDK
  waitForTransaction?(timeoutMs?: number): Promise<WCSessionRequest>;
  cancelAllTxRequests?(): Promise<void>;
}
