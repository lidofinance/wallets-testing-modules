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

test.describe('Test widget Lido app of Safe wallet (iframe)', () => {
  let browserService: BrowserService;
  const config = String(process.env.SUITE).includes('mainnet')
    ? {
        txAmount: '0.000001',
        widgetConfig: getWidgetConfig['Ethereum'],
        caseName: 'transaction initialization', // Check only tx initialization on the mainnet (without execution)
      }
    : {
        txAmount: '0.0005',
        widgetConfig: getWidgetConfig['Ethereum Hoodi'],
        caseName: 'transaction execution', // Check transaction execution
      };

  test.beforeAll(async () => {
    browserService = await initBrowserWithExtension(
      IFRAME_SAFE_COMMON_CONFIG,
      false,
      config.widgetConfig,
    );
  });

  test(`Stake ${config.caseName}`, async () => {
    await stake(browserService, config.txAmount);
  });

  test(`Wrap stETH ${config.caseName}`, async () => {
    await wrap(browserService, config.txAmount, tokenToWrap.stETH);
  });

  test(`Wrap ETH ${config.caseName}`, async () => {
    await wrap(browserService, config.txAmount, tokenToWrap.ETH);
  });

  test(`Unwrap wstETH ${config.caseName}`, async () => {
    await unwrap(browserService, config.txAmount);
  });

  test(`Request Withdraw stETH ${config.caseName}`, async () => {
    await request(browserService, config.txAmount, tokenToWithdraw.stETH);
  });

  test(`Request Withdraw wstETH ${config.caseName}`, async () => {
    await request(browserService, config.txAmount, tokenToWithdraw.wstETH);
  });

  test(`Claim ${config.caseName}`, async () => {
    await claim(browserService);
  });
});
