import { ConsoleLogger } from '@nestjs/common';
import { BrowserContext, chromium } from '@playwright/test';
import * as fs from 'fs/promises';
import path from 'path';

export type BrowserOptions = {
  locale?: string;
  reducedMotion?: null | 'reduce' | 'no-preference';
  headless?: boolean;
  slowMo?: number;
  args?: string[];
  permissions?: string[];
  httpCredentials?: {
    username: string;
    password: string;
  };
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
};

type OptionsBrowserContext = {
  // If contextDataDir is undefined - will be created temp dir for context data.
  // Else contextDataDir is not undefined - will be created user dir for context data in current folder.
  contextDataDir: string;
  browserOptions?: BrowserOptions;
};

export class BrowserContextService {
  browserContext: BrowserContext = null;
  defaultBrowserOptions: BrowserOptions;
  browserContextPaths: string[] = [];
  extensionId: string;
  private readonly logger = new ConsoleLogger(BrowserContextService.name);

  constructor(
    public walletExtensionStartPath: string,
    public options: OptionsBrowserContext,
  ) {
    this.defaultBrowserOptions = {
      locale: 'en-us',
      headless: false,
      args: [
        '--lang=en-US',
        '--disable-dev-shm-usage',
        `--disable-extensions-except=${this.walletExtensionStartPath}`,
        '--js-flags="--max-old-space-size=2048"',
      ],
      permissions: ['clipboard-read', 'clipboard-write'],
    };

    this.options.browserOptions = {
      ...this.defaultBrowserOptions,
      ...options.browserOptions,
    };
  }

  async initBrowserContext() {
    this.logger.debug(
      `Starting a new browser context (temp context: ${!this.options
        .contextDataDir})`,
    );
    let browserContextPath = '';

    if (this.options.contextDataDir) {
      browserContextPath = path.join(
        process.cwd(),
        this.options.contextDataDir,
      );

      await fs.mkdir(browserContextPath, {
        recursive: true,
      });
    }

    let attemptsLeft = 3;
    let isContextLaunched = false;
    while (attemptsLeft > 0) {
      try {
        this.browserContext = await chromium.launchPersistentContext(
          browserContextPath,
          {
            ...this.options.browserOptions,
            timeout: 20000,
          },
        );
        isContextLaunched = true;
        break;
      } catch (er) {
        attemptsLeft--;
        if (attemptsLeft == 0)
          throw new Error(`Failed to launch persistent context: ${er}`);
      }
    }

    if (!isContextLaunched) {
      await fs.rm(browserContextPath, { recursive: true, force: true });
      this.browserContext = await chromium.launchPersistentContext(
        browserContextPath,
        {
          ...this.options.browserOptions,
          timeout: 20000,
        },
      );
    }

    this.browserContext.on('page', async (page) => {
      page.once('crash', () => this.logger.error(`Page ${page.url()} crashed`));
    });
    this.browserContext.once('close', async () => {
      this.browserContext = null;
      this.browserContextPaths.push(browserContextPath);
      this.logger.debug('Browser context closed');
    });

    if (this.options.browserOptions.cookies) {
      await this.browserContext.addCookies(this.options.browserOptions.cookies);
    }

    let [background] = this.browserContext.serviceWorkers();
    if (!background)
      background = await this.browserContext.waitForEvent('serviceworker');
    this.extensionId = background.url().split('/')[2];
  }

  async closePages() {
    if (!this.browserContext) {
      return;
    }
    await this.browserContext.newPage();
    await Promise.all(
      this.browserContext
        .pages()
        .slice(0, -1)
        .map((page) => page.close()),
    );
  }
}
