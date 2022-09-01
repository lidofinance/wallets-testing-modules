import {
  Coin98,
  MathWalletPage,
  MetamaskPage,
} from '@lidofinance/wallets-testing-wallets';
import {
  EthereumPage,
  PolygonPage,
} from '@lidofinance/wallets-testing-widgets';

export const WALLET_PAGES = {
  metamask: MetamaskPage,
  coin98: Coin98,
  mathwallet: MathWalletPage,
};

export const WIDGET_PAGES = {
  ethereum: EthereumPage,
  polygon: PolygonPage,
};
