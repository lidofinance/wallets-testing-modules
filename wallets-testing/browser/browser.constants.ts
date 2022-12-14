import {
  Coin98,
  MathWalletPage,
  MetamaskPage,
  TrustWalletPage,
  ExodusPage,
  PhantomPage,
  CoinbasePage,
  TallyPage,
  GameStopPage,
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
  tally: TallyPage,
  gamestop: GameStopPage,
};

export const WIDGET_PAGES = {
  ethereum: EthereumPage,
  polygon: PolygonPage,
  kusama: KusamaPage,
  polkadot: PolkadotPage,
  solana: SolanaPage,
};
