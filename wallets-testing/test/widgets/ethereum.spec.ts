import {
  COIN98_COMMON_CONFIG,
  METAMASK_COMMON_CONFIG,
  TRUST_WALLET_COMMON_CONFIG,
  COINBASE_COMMON_CONFIG,
  EXODUS_COMMON_CONFIG,
  OKX_COMMON_CONFIG,
  BITGET_COMMON_CONFIG,
  CTRL_COMMON_CONFIG,
  SAFE_COMMON_CONFIG,
} from '@lidofinance/wallets-testing-wallets';
import { ETHEREUM_WIDGET_CONFIG } from '@lidofinance/wallets-testing-widgets';
import { BrowserService } from '../../browser';
import { test } from '@playwright/test';
import { initBrowserService } from '../test.service';

test.describe('Ethereum', () => {
  let browserService: BrowserService;

  test.beforeAll(async () => {
    browserService = await initBrowserService();
  });

  test(`Metamask stake`, async () => {
    await browserService.setupWithNode(
      METAMASK_COMMON_CONFIG,
      ETHEREUM_WIDGET_CONFIG,
      {
        stakeAmount: 100,
      },
    );
    await browserService.stake();
  });

  test(`Coin98 connect`, async () => {
    await browserService.setup(COIN98_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Exodus connect`, async () => {
    await browserService.setup(EXODUS_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Trust connect`, async () => {
    await browserService.setup(
      TRUST_WALLET_COMMON_CONFIG,
      ETHEREUM_WIDGET_CONFIG,
    );
    await browserService.connectWallet();
  });

  test(`Coinbase connect`, async () => {
    await browserService.setup(COINBASE_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Ctrl connect`, async () => {
    await browserService.setup(CTRL_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`OKX connect`, async () => {
    await browserService.setup(OKX_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Bitget connect`, async () => {
    await browserService.setup(BITGET_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test('WC+Safe connect', async () => {
    await browserService.setup(SAFE_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test.afterEach(async () => {
    await browserService.teardown();
  });
});
