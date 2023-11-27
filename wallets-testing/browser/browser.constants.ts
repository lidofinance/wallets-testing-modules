import {
  Coin98,
  MetamaskPage,
  TrustWalletPage,
  ExodusPage,
  CoinbasePage,
  TahoPage,
  XdefiPage,
  OkxPage,
  BitgetPage,
} from '@lidofinance/wallets-testing-wallets';
import {
  EthereumPage,
  KusamaPage,
  PolkadotPage,
  PolygonPage,
  SolanaPage,
} from '@lidofinance/wallets-testing-widgets';

export const WALLET_PAGES = {
  metamask: MetamaskPage,
  coin98: Coin98,
  trust: TrustWalletPage,
  exodus: ExodusPage,
  coinbase: CoinbasePage,
  taho: TahoPage,
  xdefi: XdefiPage,
  okx: OkxPage,
  bitget: BitgetPage,
};

export const WIDGET_PAGES = {
  ethereum: EthereumPage,
  polygon: PolygonPage,
  kusama: KusamaPage,
  polkadot: PolkadotPage,
  solana: SolanaPage,
};
