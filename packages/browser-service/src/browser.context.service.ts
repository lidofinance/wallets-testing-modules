import {
  COINBASE_COMMON_CONFIG,
  CTRL_COMMON_CONFIG,
} from '@lidofinance/wallets-testing-wallets';
import { ConsoleLogger } from '@nestjs/common';
import { BrowserContext, chromium, Page } from '@playwright/test';
import * as fs from 'fs/promises';
import * as os from 'os';
import path from 'path';

type OptionsBrowserContext = {
  // If contextDataDir is undefined - will be created temp dir for context data.
  // Else contextDataDir is not undefined - will be created user dir for context data in current folder.
  contextDataDir: string;
  cookies?: ReadonlyArray<{
    name: string;
    value: string;
    url?: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
  }>;
  httpCredentials?: {
    username: string;
    password: string;
  };
};

const excludeExtensionForWaitingHomePage = [
  COINBASE_COMMON_CONFIG.STORE_EXTENSION_ID,
  CTRL_COMMON_CONFIG.STORE_EXTENSION_ID,
];

export class BrowserContextService {
  page: Page;
  browserContext: BrowserContext = null;
  browserContextPaths: string[] = [];
  walletExtensionStartPath: string;
  options: OptionsBrowserContext;
  extensionId: string;
  private readonly logger = new ConsoleLogger(BrowserContextService.name);

  async setup(
    walletExtensionStartPath: string,
    options?: OptionsBrowserContext,
  ) {
    this.walletExtensionStartPath = walletExtensionStartPath;
    this.options = options;
    await this.getBrowserContextPage();
  }
  async getBrowserContextPage() {
    if (!this.browserContext) {
      await this.initBrowserContext();
    }
    return this.page;
  }

  async initBrowserContext() {
    this.logger.debug(
      `Starting a new browser context (temp context: ${!this.options
        .contextDataDir})`,
    );
    let browserContextPath;
    let isCreated;

    if (this.options.contextDataDir) {
      browserContextPath = path.join(
        process.cwd(),
        this.options.contextDataDir,
      );

      isCreated = await fs.mkdir(browserContextPath, {
        recursive: true,
      });
    } else {
      browserContextPath = await fs.mkdtemp(os.tmpdir() + path.sep);
      isCreated = true;
    }

    this.browserContext = await chromium.launchPersistentContext(
      browserContextPath,
      // @TODO: Must to use common config.
      {
        locale: 'en-us',
        headless: false,
        slowMo: 200,
        args: [
          '--lang=en-US',
          '--disable-dev-shm-usage',
          `--disable-extensions-except=${this.walletExtensionStartPath}`,
          '--js-flags="--max-old-space-size=2048"',
        ],
        httpCredentials: this.options.httpCredentials,
      },
    );
    const splitted = this.walletExtensionStartPath.split('/');
    const storeId = splitted[splitted.length - 1];

    // if dir already created by fs.mkdir method - isCreated will be undefined,
    // and hone page will not open
    if (isCreated && !excludeExtensionForWaitingHomePage.includes(storeId)) {
      await this.browserContext.waitForEvent('page');
    }

    const pages = this.browserContext.pages();
    this.page = pages.at(-1);

    this.browserContext.on('page', async (page) => {
      page.once('crash', () => this.logger.error(`Page ${page.url()} crashed`));
    });
    this.browserContext.once('close', async () => {
      this.browserContext = null;
      this.browserContextPaths.push(browserContextPath);
      this.logger.debug('Browser context closed');
    });

    if (this.options.cookies) {
      await this.browserContext.addCookies(this.options.cookies);
    }

    await this.setExtensionVars();
  }

  async setExtensionVars() {
    let [background] = this.browserContext.serviceWorkers();
    if (!background)
      background = await this.browserContext.waitForEvent('serviceworker');
    this.extensionId = background.url().split('/')[2];
  }

  async closePages() {
    if (!this.browserContext) {
      return;
    }
    this.page = await this.browserContext.newPage();
    await Promise.all(
      this.browserContext
        .pages()
        .slice(0, -1)
        .map((page) => page.close()),
    );
  }
}
