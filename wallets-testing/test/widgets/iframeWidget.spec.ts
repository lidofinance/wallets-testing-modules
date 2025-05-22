import { test } from '@playwright/test';
import { IFRAME_SAFE_COMMON_CONFIG } from '@lidofinance/wallets-testing-wallets';
import { initBrowserWithExtension, stake } from '../../utils/helpers';
import { BrowserService } from '@lidofinance/browser-service';

test.describe('Test widget in the Safe app', () => {
  let browserService: BrowserService;

  test.beforeAll(async () => {
    const isFork = false;
    await test.step('Init browser with wallet', async () => {
      browserService = await initBrowserWithExtension(
        IFRAME_SAFE_COMMON_CONFIG,
        isFork,
        'holesky',
      );
    });

    // only FORK!!! We need to send some ETH to Safe account
    // Fork for Safe is not working correctly now
    // To test SafeIframe with fork, we need to setup accounts.secretKey to EthereumNodeService class
    if (browserService.isFork) {
      const walletPage = browserService.getWalletPage();
      await walletPage.options.extensionPage.sendEthTo(
        await walletPage.getWalletAddress(),
        '50',
      );
    }
  });

  test('Lido app of Safe wallet (iframe)', async () => {
    await test.step('Fill input and click submit button', async () => {
      await stake(browserService, '0.005');
    });
  });
});
