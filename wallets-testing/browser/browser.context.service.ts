import { Injectable, Logger } from '@nestjs/common';
import { BrowserContext, chromium, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { WalletConfig } from '@lidofinance/wallets-testing-wallets';
import { EthereumNodeService } from '@lidofinance/wallets-testing-nodes';

@Injectable()
export class BrowserContextService {
  browserContext: BrowserContext = null;
  browserContextPaths: string[] = [];
  extensionConfig: WalletConfig;
  extensionId: string;
  extensionPage: Page;
  nodeUrl: string;
  private readonly logger = new Logger(BrowserContextService.name);

  constructor(private ethereumNodeService: EthereumNodeService) {}

  async setup(walletConfig: WalletConfig, nodeUrl: string) {
    this.extensionConfig = walletConfig;
    this.nodeUrl = nodeUrl;
    await this.initBrowserContext();
  }

  async initBrowserContext() {
    this.logger.debug('Starting a new browser context');
    const browserContextPath = await fs.mkdtemp(os.tmpdir() + path.sep);
    this.browserContext = await chromium.launchPersistentContext(
      browserContextPath,
      {
        locale: 'en-us',
        headless: false,
        slowMo: 200,
        args: [
          '--lang=en-US',
          '--disable-dev-shm-usage',
          `--disable-extensions-except=${this.extensionConfig.EXTENSION_PATH}`,
          `--load-extension=${this.extensionConfig.EXTENSION_PATH}`,
        ],
      },
    );
    this.browserContext.on('page', async (page) => {
      await page.once('crash', () =>
        this.logger.error(`Page ${page.url()} crashed`),
      );
    });
    this.browserContext.once('close', async () => {
      this.browserContext = null;
      this.browserContextPaths.push(browserContextPath);
      this.logger.debug('Browser context closed');
    });
    await this.setExtensionVars();
    await this.ethereumNodeService.mockRoute(
      this.extensionConfig.COMMON.RPC_URL_PATTERN,
      this.extensionPage,
    );
    await this.ethereumNodeService.mockRoute(this.nodeUrl, this.browserContext);
  }

  async setExtensionVars() {
    this.extensionPage = this.browserContext.backgroundPages()[0];
    if (this.extensionPage === undefined)
      this.extensionPage = await Promise.race([
        this.browserContext.waitForEvent('page'),
        this.browserContext.waitForEvent('backgroundpage'),
      ]);
    this.extensionId = await this.extensionPage.evaluate('chrome.runtime.id');
  }

  async closePages() {
    if (!this.browserContext) return;
    await this.browserContext.newPage();
    await Promise.all([
      this.browserContext
        .pages()
        .slice(0, -1)
        .map((page) => page.close()),
    ]);
  }

  async clearStaleBrowserContexts() {
    const contexts = this.browserContextPaths.length;
    if (contexts > 0) {
      for (const contextPath of this.browserContextPaths) {
        await fs.rm(contextPath, { force: true, recursive: true });
      }
      this.logger.debug('Removed ' + contexts + ' stale browser contexts');
      this.browserContextPaths = [];
    }
  }
}
