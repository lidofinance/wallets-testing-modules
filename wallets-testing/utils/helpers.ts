import { Locator } from '@playwright/test';
import { BrowserService } from '@lidofinance/browser-service';
import { CommonWalletConfig } from '@lidofinance/wallets-testing-wallets';
import { configService, getWidgetConfig, WidgetConfig } from '../config';
import { WidgetService } from '../services';
import { tokenToWithdraw, tokenToWrap } from '../pages';

type initBrowserOptions = {
  walletConfig: CommonWalletConfig;
  isFork?: boolean;
  widgetConfig?: WidgetConfig;
};

export async function initBrowserWithExtension({
  walletConfig,
  isFork = false,
  widgetConfig = getWidgetConfig['Ethereum'],
}: initBrowserOptions) {
  const browserService = new BrowserService({
    networkConfig: widgetConfig.network,
    accountConfig: {
      SECRET_PHRASE: configService.get('WALLET_SECRET_PHRASE'),
      PASSWORD: configService.get('WALLET_PASSWORD'),
    },
    walletConfig: walletConfig,
    nodeConfig: {
      rpcUrl: widgetConfig.network.rpcUrl,
      rpcUrlToMock: [widgetConfig.rpcUrlToMock],
    },
    browserOptions: {
      slowMo: 200,
      cookies: MATOMO_EVENT_TEST_COOKIE,
    },
    standUrl: widgetConfig.url,
  });

  await browserService.initWalletSetup(isFork);

  // We abort this request because we need to reduce the request count to the Elliptic api
  await browserService
    .getBrowserContextPage()
    .context()
    .route(new RegExp('.*/api/validation\\?.*'), async (route) => {
      await route.abort();
    });

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

export async function wrap(
  browserService: BrowserService,
  txAmount: string,
  token: tokenToWrap,
) {
  const widgetService = new WidgetService(browserService);
  await widgetService.connectWallet();
  await widgetService.doWrapping(txAmount, token);
}

export async function unwrap(browserService: BrowserService, txAmount: string) {
  const widgetService = new WidgetService(browserService);
  await widgetService.connectWallet();
  await widgetService.doUnwrapping(txAmount);
}

export async function request(
  browserService: BrowserService,
  txAmount: string,
  token: tokenToWithdraw,
) {
  const widgetService = new WidgetService(browserService);
  await widgetService.connectWallet();
  await widgetService.doWithdrawal(txAmount, token);
}

export async function claim(browserService: BrowserService) {
  const widgetService = new WidgetService(browserService);
  await widgetService.connectWallet();
  await widgetService.doClaiming();
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

const MATOMO_EVENT_TEST_COOKIE = [
  {
    name: 'meta-info',
    value: 'test',
    domain: '.lido.fi',
    path: '/',
    maxAge: 86400,
    sameSite: 'Lax',
    secure: true,
  },
];
