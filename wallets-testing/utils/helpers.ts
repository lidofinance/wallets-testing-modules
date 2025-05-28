import { Locator } from '@playwright/test';
import { BrowserService } from '@lidofinance/browser-service';
import {
  CommonWalletConfig,
  NETWORKS_CONFIG,
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
    standUrl: getStandUrlByNetwork(network),
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

function getStandUrlByNetwork(network: string): string {
  switch (network) {
    case 'hoodi':
      return 'https://stake-hoodi.testnet.fi';
    case 'holesky':
      return 'https://stake-holesky.testnet.fi';
    default:
      return 'https://stake.lido.fi';
  }
}
