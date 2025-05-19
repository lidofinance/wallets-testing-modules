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
import { test } from '@playwright/test';
import {
  connectWallet,
  initBrowserWithExtension,
  stake,
} from '../../utils/helpers';
import { BrowserService } from '@lidofinance/browser-service';

test.describe('Ethereum', () => {
  let browserService: BrowserService;

  test(`Metamask stake`, async () => {
    browserService = await initBrowserWithExtension(
      METAMASK_COMMON_CONFIG,
      true,
    );
    await stake(browserService, { txAmount: '50' });
  });

  test(`Coin98 connect`, async () => {
    browserService = await initBrowserWithExtension(COIN98_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Exodus connect`, async () => {
    browserService = await initBrowserWithExtension(EXODUS_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Trust connect`, async () => {
    browserService = await initBrowserWithExtension(TRUST_WALLET_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Coinbase connect`, async () => {
    browserService = await initBrowserWithExtension(COINBASE_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Ctrl connect`, async () => {
    browserService = await initBrowserWithExtension(CTRL_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`OKX connect`, async () => {
    browserService = await initBrowserWithExtension(OKX_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test(`Bitget connect`, async () => {
    browserService = await initBrowserWithExtension(BITGET_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test('WC+Safe connect', async () => {
    browserService = await initBrowserWithExtension(SAFE_COMMON_CONFIG);
    await connectWallet(browserService);
  });

  test.afterEach(async () => {
    await browserService.teardown();
  });
});
