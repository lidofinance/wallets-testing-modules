import { BrowserContext } from '@playwright/test';

export async function closeUnnecessaryPages(browserContext: BrowserContext) {
  const pages = browserContext.pages().slice(1);
  for (const page of pages) {
    await page.close();
  }
}
