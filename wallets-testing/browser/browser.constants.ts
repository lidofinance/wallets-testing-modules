import {
  Coin98,
  MathWalletPage,
  MetamaskPage,
  TrustWalletPage,
  ExodusPage,
  PhantomPage,
  CoinbasePage,
  TahoPage,
  GameStopPage,
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
  mathwallet: MathWalletPage,
  trust: TrustWalletPage,
  exodus: ExodusPage,
  phantom: PhantomPage,
  coinbase: CoinbasePage,
  taho: TahoPage,
  gamestop: GameStopPage,
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
