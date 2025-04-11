import {
  COIN98_COMMON_CONFIG,
  TRUST_WALLET_COMMON_CONFIG,
  COINBASE_COMMON_CONFIG,
  EXODUS_COMMON_CONFIG,
  OKX_COMMON_CONFIG,
  BITGET_COMMON_CONFIG,
  CTRL_COMMON_CONFIG,
  SAFE_COMMON_CONFIG,
  METAMASK_COMMON_CONFIG,
} from '@lidofinance/wallets-testing-wallets';

import { BrowserService } from '@lidofinance/browser-service';
import { test } from '@playwright/test';
import { connectWallet, initBrowserService } from '../test.service';
import { EthereumPage } from '@lidofinance/wallets-testing-widgets';

test.describe('Ethereum', () => {
  let browserService: BrowserService;
  let widgetService: EthereumPage;

  test(`Metamask stake`, async () => {
    METAMASK_COMMON_CONFIG.LATEST_STABLE_DOWNLOAD_LINK = undefined;
    browserService = await initBrowserService(METAMASK_COMMON_CONFIG);
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
    browserService = await initBrowserService(COIN98_COMMON_CONFIG);
    await browserService.setup();
    await connectWallet(browserService);
  });

  test(`Exodus connect`, async () => {
    browserService = await initBrowserService(EXODUS_COMMON_CONFIG);
    await browserService.setup();
    await connectWallet(browserService);
  });

  test(`Trust connect`, async () => {
    browserService = await initBrowserService(TRUST_WALLET_COMMON_CONFIG);
    await browserService.setup();
    await connectWallet(browserService);
  });

  test(`Coinbase connect`, async () => {
    browserService = await initBrowserService(COINBASE_COMMON_CONFIG);
    await browserService.setup();
    await connectWallet(browserService);
  });

  test(`Ctrl connect`, async () => {
    browserService = await initBrowserService(CTRL_COMMON_CONFIG);
    await browserService.setup();
    await connectWallet(browserService);
  });

  test(`OKX connect`, async () => {
    browserService = await initBrowserService(OKX_COMMON_CONFIG);
    await browserService.setup();
    await connectWallet(browserService);
  });

  test(`Bitget connect`, async () => {
    browserService = await initBrowserService(BITGET_COMMON_CONFIG);
    await browserService.setup();
    await connectWallet(browserService);
  });

  test('WC+Safe connect', async () => {
    browserService = await initBrowserService(SAFE_COMMON_CONFIG);
    await browserService.setup();
    await connectWallet(browserService);
  });

  test.afterEach(async () => {
    await browserService.teardown();
  });
});
