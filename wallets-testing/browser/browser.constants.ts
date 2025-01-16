import {
  Coin98,
  MetamaskPage,
  TrustWalletPage,
  ExodusPage,
  CoinbasePage,
  OkxPage,
  BitgetPage,
  CtrlPage,
} from '@lidofinance/wallets-testing-wallets';
import { EthereumPage } from '@lidofinance/wallets-testing-widgets';

export const WALLET_PAGES = {
  metamask: MetamaskPage,
  coin98: Coin98,
  trust: TrustWalletPage,
  exodus: ExodusPage,
  coinbase: CoinbasePage,
  okx: OkxPage,
  bitget: BitgetPage,
  ctrl: CtrlPage,
};

export const WIDGET_PAGES = {
  ethereum: EthereumPage,
};
