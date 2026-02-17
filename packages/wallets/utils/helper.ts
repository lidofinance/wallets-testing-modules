import { BrowserContext, Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';

/** This function helps to find the wallet page with the transaction or any wallet's notification */
export async function getNotificationPage(
  context: BrowserContext,
  extensionUrl: string,
  timeout = 10000,
) {
  const logger = new ConsoleLogger('PageWaiter');
  const isWalletPage = (page: Page) => page.url().includes(extensionUrl);

  let walletPage: Page | undefined;
  await test.step('Looking for the wallet page', async () => {
    const attempts = 3;

    for (let i = 1; i <= attempts; i++) {
      walletPage = context.pages().find(isWalletPage);
      if (!walletPage) {
        walletPage = await context.waitForEvent('page', {
          predicate: isWalletPage,
          timeout,
        });
      }

      if (walletPage) break;
      logger.debug(`wallet is not opened [attempt ${i}]`);
    }
  });

  await test.step('Wait for page loaded', async () => {
    try {
      await Promise.all([
        walletPage.waitForLoadState('domcontentloaded', {
          timeout: 10000,
        }),
        walletPage.waitForLoadState('networkidle', {
          timeout: 10000,
        }),
      ]);
    } catch (er) {
      logger.debug('Page loading timeout');
    }
  });

  return walletPage;
}
