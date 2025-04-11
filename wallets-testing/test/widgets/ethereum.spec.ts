import {
  COIN98_COMMON_CONFIG,
  TRUST_WALLET_COMMON_CONFIG,
  COINBASE_COMMON_CONFIG,
  EXODUS_COMMON_CONFIG,
  OKX_COMMON_CONFIG,
  BITGET_COMMON_CONFIG,
  CTRL_COMMON_CONFIG,
  SAFE_COMMON_CONFIG,
} from '@lidofinance/wallets-testing-wallets';

import { BrowserService } from '@lidofinance/browser-service';
import { test } from '@playwright/test';
import { initBrowserService } from '../test.service';
import { EthereumPage } from '@lidofinance/wallets-testing-widgets';
import { WIDGET_PAGES } from '../../config/browser.constants';

async function connectWallet(browserService: BrowserService) {
  const browserContext = await browserService.getBrowserContext();
  const widgetPage = new WIDGET_PAGES['ethereum'](browserContext.pages()[0], {
    stakeAmount: 50,
  });
  await widgetPage.navigate();
  await widgetPage.connectWallet(browserService.getWalletPage());
}

test.describe('Ethereum', () => {
  let browserService: BrowserService;
  let widgetService: EthereumPage;

  test.beforeAll(async () => {
    browserService = await initBrowserService();
  });

  test(`Metamask stake`, async () => {
    await browserService.setupWithNode();
    const browserContext = await browserService.getBrowserContext();
    widgetService = new EthereumPage(browserContext.pages()[0], {
      stakeAmount: 50,
    });
    await widgetService.navigate();
    await widgetService.connectWallet(browserService.getWalletPage());
    await widgetService.doStaking(browserService.getWalletPage());
  });

  test(`Coin98 connect`, async () => {
    await browserService.setup(COIN98_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Exodus connect`, async () => {
    await browserService.setup(EXODUS_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Trust connect`, async () => {
    await browserService.setup(TRUST_WALLET_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Coinbase connect`, async () => {
    await browserService.setup(COINBASE_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Ctrl connect`, async () => {
    await browserService.setup(CTRL_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`OKX connect`, async () => {
    await browserService.setup(OKX_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Bitget connect`, async () => {
    await browserService.setup(BITGET_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test('WC+Safe connect', async () => {
    await browserService.setup(SAFE_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test.afterEach(async () => {
    await browserService.teardown();
  });
});
