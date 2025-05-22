import { Locator } from '@playwright/test';
import { BrowserService } from '@lidofinance/browser-service';
import {
  CommonWalletConfig,
  NETWORKS_CONFIG,
  WalletTypes,
} from '@lidofinance/wallets-testing-wallets';
import { configService, widgetConfig } from '../config';
import { WidgetService } from '../services';

export async function initBrowserWithExtension(
  walletConfig: CommonWalletConfig,
  isFork = false,
  network: 'ethereum' | 'holesky' | 'hoodi' = 'ethereum',
) {
  const browserService = new BrowserService({
    networkConfig: networkConfig(network),
    accountConfig: {
      SECRET_PHRASE: configService.get('WALLET_SECRET_PHRASE'),
      PASSWORD: configService.get('WALLET_PASSWORD'),
    },
    walletConfig: walletConfig,
    nodeConfig: {
      rpcUrlToMock: widgetConfig[networkConfig(network).chainName].nodeUrl,
    },
    browserOptions: {
      slowMo: 200,
    },
  });

  await browserService.initWalletSetup(isFork);
  if (
    browserService.getWalletPage().options.walletConfig.WALLET_TYPE ===
    WalletTypes.IFRAME
  )
    await browserService.getWalletPage().initIframeWallet();

  return browserService;
}

export async function connectWallet(browserService: BrowserService) {
  const widgetService = new WidgetService(
    browserService,
    widgetConfig[browserService.options.networkConfig.chainName],
  );
  await widgetService.connectWallet();
}

// Function not tested with walletTypes.WC
export async function stake(browserService: BrowserService, txAmount: string) {
  const widgetService = new WidgetService(
    browserService,
    widgetConfig[browserService.options.networkConfig.chainName],
  );
  await widgetService.connectWallet();
  await widgetService.doStaking(txAmount);
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

function networkConfig(network: string) {
  if (network === 'hoodi') {
    return NETWORKS_CONFIG.testnet.ETHEREUM_HOODI;
  } else if (network === 'holesky') {
    return NETWORKS_CONFIG.testnet.ETHEREUM_HOLESKY;
  } else {
    return {
      ...NETWORKS_CONFIG.mainnet.ETHEREUM,
      rpcUrl: configService.get('RPC_URL'),
    };
  }
}
