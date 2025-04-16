import { BrowserService } from '@lidofinance/browser-service';
import {
  CommonWalletConfig,
  NETWORKS_CONFIG,
} from '@lidofinance/wallets-testing-wallets';
import { configService, ETHEREUM_WIDGET_CONFIG } from '../config';
import { WidgetService, TxConfig } from './service.widget';

export async function initBrowserWithExtension(
  walletConfig: CommonWalletConfig,
  isFork = false,
) {
  const browserService = new BrowserService({
    networkConfig: {
      ...NETWORKS_CONFIG.Mainnet.ETHEREUM,
      rpcUrl: configService.get('RPC_URL'),
    },
    accountConfig: {
      SECRET_PHRASE: configService.get('WALLET_SECRET_PHRASE'),
      PASSWORD: configService.get('WALLET_PASSWORD'),
    },
    walletConfig: walletConfig,
    nodeConfig: {
      rpcUrlToMock: ETHEREUM_WIDGET_CONFIG.nodeUrl,
    },
    browserOptions: {
      slowMo: 200,
    },
  });

  if (isFork) {
    await browserService.setupWithNode();
  } else {
    await browserService.setup();
  }

  return browserService;
}

export async function connectWallet(browserService: BrowserService) {
  const widgetService = new WidgetService(browserService);
  await widgetService.navigate();
  await widgetService.connectWallet();
}

export async function stake(
  browserService: BrowserService,
  txConfig: TxConfig,
) {
  const widgetService = new WidgetService(browserService);
  await widgetService.navigate();
  await widgetService.connectWallet();
  await widgetService.doStaking(txConfig);
}
