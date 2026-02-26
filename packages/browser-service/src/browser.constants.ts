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
  WCWallet,
} from '@lidofinance/wallets-testing-wallets';
import { z } from 'zod';

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
  walletconnect: WCWallet,
};

export const DEFAULT_BROWSER_CONTEXT_DIR_NAME = '.browser_context';

export const BrowserExtension = z.object({
  id: z.string(),
  name: z.string(),
});
