import { test } from '@playwright/test';
import { IFRAME_SAFE_COMMON_CONFIG } from '@lidofinance/wallets-testing-wallets';
import {
  initBrowserWithExtension,
  request,
  stake,
  unwrap,
  wrap,
} from '../../utils/helpers';
import { BrowserService } from '@lidofinance/browser-service';
import { getWidgetConfig } from '../../config';
import { tokenToWithdraw, tokenToWrap } from '../../pages';

test.describe('Test widget Lido app of Safe wallet (iframe)', () => {
  let browserService: BrowserService;

  test.beforeAll(async () => {
    const isFork = false;
    browserService = await initBrowserWithExtension(
      IFRAME_SAFE_COMMON_CONFIG,
      isFork,
      getWidgetConfig['Ethereum Hoodi'],
    );
  });

  test('Stake', async () => {
    await stake(browserService, '0.005');
  });

  test('Wrap stETH', async () => {
    await wrap(browserService, '0.005', tokenToWrap.stETH);
  });

  test('Wrap ETH', async () => {
    await wrap(browserService, '0.005', tokenToWrap.ETH);
  });

  test('Unwrap wstETH', async () => {
    await unwrap(browserService, '0.005');
  });

  test('Request Withdraw stETH', async () => {
    await request(browserService, '0.005', tokenToWithdraw.stETH);
  });

  test('Request Withdraw wstETH', async () => {
    await request(browserService, '0.005', tokenToWithdraw.wstETH);
  });
});
