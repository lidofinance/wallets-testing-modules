import { Locator, Page, test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';

export class HomePage {
  logger: ConsoleLogger;
  wcBtn: Locator;
  wcUrlInput: Locator;
  approveBtn: Locator;
  connectedAppIcon: Locator;

  constructor(public page: Page) {
    this.logger = new ConsoleLogger('WC+Safe wallet. Home page');
    this.wcBtn = this.page.locator('[title="WalletConnect"]');
    this.wcUrlInput = this.page.locator('input[placeholder="wc:"]');
    this.approveBtn = this.page.locator('button:has-text("Approve")');
    this.connectedAppIcon = this.page.locator('img[alt="Connected dApp icon"]');
  }

  async connectWallet(wcUrl: string) {
    await test.step('Connect wallet', async () => {
      await test.step('Fill the WC url', async () => {
        await this.wcBtn.waitFor({ state: 'visible' });
        await this.wcBtn.click();
        await this.wcUrlInput.fill(wcUrl);
      });

      await test.step('Approve wallet connection', async () => {
        try {
          await this.approveBtn.waitFor({ state: 'visible', timeout: 5000 });
          await this.approveBtn.click();
        } catch {
          this.logger.log('Connection approve is unnecessary');
        }
      });

      await this.connectedAppIcon.waitFor({ state: 'visible', timeout: 3000 });
      await this.page.close();
    });
  }
}
