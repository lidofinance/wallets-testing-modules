import { Injectable, Logger } from '@nestjs/common';
import { BrowserContext, chromium, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { WalletConfig } from '@lidofinance/wallets-testing-wallets';
import { EthereumNodeService } from '@lidofinance/wallets-testing-nodes';
import {
  ExtensionService,
  Manifest,
} from '@lidofinance/wallets-testing-extensions';

@Injectable()
export class BrowserContextService {
  browserContext: BrowserContext = null;
  browserContextPaths: string[] = [];
  walletConfig: WalletConfig;
  extensionId: string;
  extensionPage: Page;
  nodeUrl: string;
  private readonly logger = new Logger(BrowserContextService.name);

  constructor(
    private ethereumNodeService: EthereumNodeService,
    private extensionService: ExtensionService,
  ) {}

  async setup(walletName: string, walletConfig: WalletConfig, nodeUrl: string) {
    this.walletConfig = walletConfig;
    this.nodeUrl = nodeUrl;
    await this.initBrowserContext(walletName);
  }

  async initBrowserContext(walletName: string) {
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
          `--disable-extensions-except=${this.walletConfig.EXTENSION_PATH}`,
          `--load-extension=${this.walletConfig.EXTENSION_PATH}`,
          '--js-flags="--max-old-space-size=2048"',
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
    await this.setExtensionVars(
      walletName,
      this.walletConfig.COMMON.EXTENSION_START_PATH,
    );
    if (this.ethereumNodeService.state) {
      await this.ethereumNodeService.mockRoute(
        this.nodeUrl,
        this.browserContext,
      );
    }
  }

  async setExtensionVars(walletName: string, extensionStartPath: string) {
    if (walletName === 'bitget') {
      const page = await this.browserContext.newPage();
      await page.goto('chrome://extensions/');
      await page.click('id=devMode');
      let extensionId = await page.locator('id=extension-id').textContent();
      extensionId = extensionId.replace('ID: ', '');
      this.extensionId = extensionId;
    } else {
      const manifest = await this.extensionService.getManifestVersion(
        this.walletConfig.EXTENSION_PATH,
      );
      switch (manifest) {
        case Manifest.v2: {
          let [background] = this.browserContext.backgroundPages();
          if (background === undefined)
            background = await this.browserContext.waitForEvent(
              'backgroundpage',
            );
          this.extensionPage = background;
          this.extensionId = background.url().split('/')[2];
          break;
        }
        case Manifest.v3: {
          let [background] = this.browserContext.serviceWorkers();
          if (!background)
            background = await this.browserContext.waitForEvent(
              'serviceworker',
            );
          const extensionId = background.url().split('/')[2];
          this.extensionPage = await this.browserContext.newPage();
          await this.extensionPage.goto(
            `chrome-extension://${extensionId}${extensionStartPath}`,
          );
          this.extensionId = extensionId;
        }
      }
    }
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
