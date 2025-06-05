import {
  BitgetPage,
  Coin98,
  CoinbasePage,
  CtrlPage,
  ExodusPage,
  MetamaskPage,
  OkxPage,
  SafeWcPage,
  TrustWalletPage,
} from '@lidofinance/wallets-testing-wallets';

export const WALLET_PAGES = {
  metamask: MetamaskPage,
  okx: OkxPage,
  coin98: Coin98,
  exodus: ExodusPage,
  trust: TrustWalletPage,
  coinbase: CoinbasePage,
  ctrl: CtrlPage,
  bitget: BitgetPage,
  safeWc: SafeWcPage,
};

export const DEFAULT_BROWSER_CONTEXT_DIR_NAME = '.browser_context';
