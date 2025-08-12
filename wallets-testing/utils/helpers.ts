import { Locator } from '@playwright/test';
import { BrowserService } from '@lidofinance/browser-service';
import { CommonWalletConfig } from '@lidofinance/wallets-testing-wallets';
import { configService, getWidgetConfig, WidgetConfig } from '../config';
import { WidgetService } from '../services';

export async function initBrowserWithExtension(
  walletConfig: CommonWalletConfig,
  isFork = false,
  widgetConfig: WidgetConfig = getWidgetConfig['Ethereum Mainnet'],
) {
  const browserService = new BrowserService({
    networkConfig: widgetConfig.network,
    accountConfig: {
      SECRET_PHRASE: configService.get('WALLET_SECRET_PHRASE'),
      PASSWORD: configService.get('WALLET_PASSWORD'),
    },
    walletConfig: walletConfig,
    nodeConfig: {
      rpcUrl: widgetConfig.network.rpcUrl,
      rpcUrlToMock: widgetConfig.rpcUrlToMock,
    },
    browserOptions: {
      slowMo: 200,
    },
    standUrl: widgetConfig.url,
  });

  await browserService.initWalletSetup(isFork);
  return browserService;
}

export async function connectWallet(browserService: BrowserService) {
  const widgetService = new WidgetService(browserService);
  await widgetService.connectWallet();
}

// Function not tested with walletConnectTypes.WC
export async function stake(browserService: BrowserService, txAmount: string) {
  const widgetService = new WidgetService(browserService);
  await widgetService.connectWallet();
  await widgetService.doStaking(txAmount);
}

export async function wrapStETH(
  browserService: BrowserService,
  txAmount: string,
) {
  const widgetService = new WidgetService(browserService);
  await widgetService.connectWallet();
  await widgetService.doWrapping(txAmount);
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
