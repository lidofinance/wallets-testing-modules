import { BrowserContext, Page } from '@playwright/test';
import {
  AccountConfig,
  CommonWalletConfig,
  NetworkConfig,
  StandConfig,
} from './wallets.constants';

/** Required options to manage wallet */
export interface WalletPageOptions {
  browserContext: BrowserContext;
  walletConfig: CommonWalletConfig;
  accountConfig?: AccountConfig;
  extensionUrl?: string;
  extensionPage?: WalletPage;
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
export interface WalletPage {
  options: WalletPageOptions;
  page?: Page;

  setup(): Promise<void>;

  importKey(secretKey: string, withChecks?: boolean): Promise<void>;

  /** @param param is url walletConnect */
  connectWallet(param?: string): Promise<void>;

  assertTxAmount(expectedAmount: string): Promise<void>;

  confirmTx(setAggressiveGas?: boolean): Promise<void>;

  cancelTx(): Promise<void>;

  openLastTxInEthplorer?(txIndex?: number): Promise<Page>;

  getTokenBalance?(tokenName: string): Promise<number>;

  confirmAddTokenToWallet?(): Promise<void>;

  assertReceiptAddress(expectedAddress: string): Promise<void>;

  getWalletAddress?(): Promise<string>;

  setupNetwork?(networkConfig: NetworkConfig): Promise<void>;

  addNetwork(networkConfig: NetworkConfig): Promise<void>;

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
  cancelAllTxRequests?(): Promise<void>;
}
