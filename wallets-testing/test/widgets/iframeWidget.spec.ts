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

const isMainnet = String(process.env.SUITE).includes('mainnet');

test.describe('Test widget Lido app of Safe wallet (iframe)', () => {
  let browserService: BrowserService;
  const config = {
    txAmount: isMainnet ? '0.000001' : '0.0005',
    widgetConfig: getWidgetConfig[isMainnet ? 'Ethereum' : 'Ethereum Hoodi'],
    // Mainnet -> Check only tx initialization || Hoodi -> Check full tx execution
    caseName: `transaction ${isMainnet ? 'initialization' : 'execution'}`,
  };

  test.beforeAll(async () => {
    browserService = await initBrowserWithExtension({
      walletConfig: IFRAME_SAFE_COMMON_CONFIG,
      widgetConfig: config.widgetConfig,
    });
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
