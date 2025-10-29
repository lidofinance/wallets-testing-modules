import { test } from '@playwright/test';
import { IFRAME_SAFE_COMMON_CONFIG } from '@lidofinance/wallets-testing-wallets';
import {
  claim,
  initBrowserWithExtension,
  request,
  stake,
  unwrap,
  wrap,
} from '../../utils/helpers';
import { BrowserService } from '@lidofinance/browser-service';
import { getWidgetConfig } from '../../config';
import { tokenToWithdraw, tokenToWrap } from '../../pages';

test.describe(
  'Test widget Lido app of Safe wallet (iframe) [Hoodi]',
  { tag: '@hoodi' },
  () => {
    let browserService: BrowserService;
    const txAmount = '0.0005';

    test.beforeAll(async () => {
      const isFork = false;
      browserService = await initBrowserWithExtension(
        IFRAME_SAFE_COMMON_CONFIG,
        isFork,
        getWidgetConfig['Ethereum Hoodi'],
      );
    });

    test('Stake', async () => {
      await stake(browserService, txAmount);
    });

    test('Wrap stETH', async () => {
      await wrap(browserService, txAmount, tokenToWrap.stETH);
    });

    test('Wrap ETH', async () => {
      await wrap(browserService, txAmount, tokenToWrap.ETH);
    });

    test('Unwrap wstETH', async () => {
      await unwrap(browserService, txAmount);
    });

    test('Request Withdraw stETH', async () => {
      await request(browserService, txAmount, tokenToWithdraw.stETH);
    });

    test('Request Withdraw wstETH', async () => {
      await request(browserService, txAmount, tokenToWithdraw.wstETH);
    });

    test('Claim', async () => {
      await claim(browserService);
    });
  },
);

// Check only tx initialization on the mainnet (without execution)
test.describe(
  'Test widget Lido app of Safe wallet (iframe) [Ethereum Mainnet]',
  { tag: '@mainnet' },
  () => {
    let browserService: BrowserService;
    const txAmount = '0.000001';

    test.beforeAll(async () => {
      const isFork = false;
      browserService = await initBrowserWithExtension(
        IFRAME_SAFE_COMMON_CONFIG,
        isFork,
        getWidgetConfig['Ethereum'],
      );
    });

    test('Init Stake tx', async () => {
      await stake(browserService, txAmount);
    });

    test('Init Wrap stETH tx', async () => {
      await wrap(browserService, txAmount, tokenToWrap.stETH);
    });

    test('Init Wrap ETH tx', async () => {
      await wrap(browserService, txAmount, tokenToWrap.ETH);
    });

    test('Init Unwrap wstETH tx', async () => {
      await unwrap(browserService, txAmount);
    });

    test('Init Request Withdraw stETH tx', async () => {
      await request(browserService, txAmount, tokenToWithdraw.stETH);
    });

    test('Init Request Withdraw wstETH tx', async () => {
      await request(browserService, txAmount, tokenToWithdraw.wstETH);
    });

    test('Init Claim tx', async () => {
      await claim(browserService);
    });
  },
);
