import {
  BitgetPage,
  Coin98,
  CoinbasePage,
  CtrlPage,
  ExodusPage,
  MetamaskLatestPage,
  MetamaskStablePage,
  OkxPage,
  SafeIframePage,
  SafeWcPage,
  TrustWalletPage,
} from '@lidofinance/wallets-testing-wallets';

export const WALLET_PAGES = {
  metamaskStable: MetamaskStablePage,
  metamaskLatest: MetamaskLatestPage,
  okx: OkxPage,
  coin98: Coin98,
  exodus: ExodusPage,
  trust: TrustWalletPage,
  coinbase: CoinbasePage,
  ctrl: CtrlPage,
  bitget: BitgetPage,
  safeWc: SafeWcPage,
  safeIframe: SafeIframePage,
};

export const DEFAULT_BROWSER_CONTEXT_DIR_NAME = '.browser_context';
