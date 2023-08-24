import { BrowserContext, Page } from 'playwright';
import { CHROME_WEBSTORE_URL } from './extension.constants';

export class ExtensionStorePage {
  private page: Page | undefined;
  constructor(
    private browserContext: BrowserContext,
    private extensionId: string,
  ) {}

  async navigate() {
    this.page = await this.browserContext.newPage();
    const url = new URL(
      'webstore/detail/' + this.extensionId,
      CHROME_WEBSTORE_URL,
    );
    await this.page.goto(url.href);
  }

  async getVersion(): Promise<string> {
    if (!this.page) throw "Page isn't ready";
    return (
      (await this.page.textContent(
        "span:near(:text('Version'):below(:text('Additional Information')))",
      )) || 'version not found'
    );
  }

  async close() {
    if (this.page !== undefined) {
      await this.page.close();
      this.page = undefined;
    }
  }
}
