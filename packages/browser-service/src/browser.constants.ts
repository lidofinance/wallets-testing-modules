import {
  BitgetPage,
  Coin98,
  CoinbasePage,
  CtrlPage,
  ExodusPage,
  MetamaskPage,
  MetamaskStablePage,
  OkxPage,
  SafeIframePage,
  SafeWcPage,
  TrustWalletPage,
  WCSDKWallet,
} from '@lidofinance/wallets-testing-wallets';

export const WALLET_PAGES = {
  metamaskStable: MetamaskStablePage,
  metamask: MetamaskPage,
  okx: OkxPage,
  coin98: Coin98,
  exodus: ExodusPage,
  trust: TrustWalletPage,
  coinbase: CoinbasePage,
  ctrl: CtrlPage,
  bitget: BitgetPage,
  safeWc: SafeWcPage,
  safeIframe: SafeIframePage,
  wcSDK: WCSDKWallet,
};

export const DEFAULT_BROWSER_CONTEXT_DIR_NAME = '.browser_context';
