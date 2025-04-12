import { configService } from '../config';
import {
  ETHEREUM_WIDGET_CONFIG,
  EthereumPage,
} from '@lidofinance/wallets-testing-widgets';
import { BrowserService } from '@lidofinance/browser-service';
import {
  CommonWalletConfig,
  NETWORKS_CONFIG,
} from '@lidofinance/wallets-testing-wallets';

export async function initBrowserService(commonConfig: CommonWalletConfig) {
  return new BrowserService({
    networkConfig: {
      ...NETWORKS_CONFIG.Mainnet.ETHEREUM,
      rpcUrl: configService.get('RPC_URL'),
    },
    walletConfig: {
      SECRET_PHRASE: configService.get('WALLET_SECRET_PHRASE'),
      PASSWORD: configService.get('WALLET_PASSWORD'),
      COMMON: commonConfig,
      NETWORK_NAME: ETHEREUM_WIDGET_CONFIG.networkName, // @TODO: remove it
    },
    nodeConfig: {
      rpcUrlToMock: ETHEREUM_WIDGET_CONFIG.nodeUrl,
    },
    browserOptions: {
      slowMo: 200,
    },
  });
}

export async function connectWallet(browserService: BrowserService) {
  const browserContext = await browserService.getBrowserContext();
  const widgetPage = new EthereumPage(browserContext.pages()[0], {
    stakeAmount: 50,
  });
  await widgetPage.navigate();
  await widgetPage.connectWallet(browserService.getWalletPage());
  return widgetPage;
}
