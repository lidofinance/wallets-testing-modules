import { test } from '@playwright/test';
import { IFRAME_SAFE_COMMON_CONFIG } from '@lidofinance/wallets-testing-wallets';
import {
  initBrowserWithExtension,
  stake,
  wrapStETH,
} from '../../utils/helpers';
import { BrowserService } from '@lidofinance/browser-service';

test.describe('Test widget Lido app of Safe wallet (iframe)', () => {
  let browserService: BrowserService;

  test.beforeAll(async () => {
    const isFork = false;
    const network = 'hoodi';
    browserService = await initBrowserWithExtension(
      IFRAME_SAFE_COMMON_CONFIG,
      isFork,
      network,
    );
  });

  test('Stake', async () => {
    await stake(browserService, '0.005');
  });

  test('Wrap', async () => {
    await wrapStETH(browserService, '0.005');
  });
});
