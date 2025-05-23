import { Locator } from '@playwright/test';
import { BrowserService } from '@lidofinance/browser-service';
import {
  CommonWalletConfig,
  NETWORKS_CONFIG,
} from '@lidofinance/wallets-testing-wallets';
import { configService, ETHEREUM_WIDGET_CONFIG } from '../config';
import { WidgetService, TxConfig } from '../services';

export async function initBrowserWithExtension(
  walletConfig: CommonWalletConfig,
  isFork = false,
) {
  const browserService = new BrowserService({
    networkConfig: {
      ...NETWORKS_CONFIG.mainnet.ETHEREUM,
      rpcUrl:
        walletConfig.WALLET_NAME == 'metamask'
          ? 'http://127.0.0.1:8545'
          : configService.get('RPC_URL'),
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

export async function waitForTextContent(locator: Locator) {
  return await locator.evaluate(async (element) => {
    return new Promise<string>((resolve) => {
      const checkText = () => {
        const text = element.textContent.trim();
        if (text.length > 0) {
          resolve(text);
        } else {
          requestAnimationFrame(checkText);
        }
      };
      requestAnimationFrame(checkText);
    });
  });
}
