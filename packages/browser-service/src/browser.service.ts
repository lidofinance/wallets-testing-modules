import {
  AccountConfig,
  CommonWalletConfig,
  NetworkConfig,
  WalletPage,
  WalletTypes,
} from '@lidofinance/wallets-testing-wallets';
import {
  Extension,
  ExtensionService,
} from '@lidofinance/wallets-testing-extensions';
import { EthereumNodeService } from '@lidofinance/wallets-testing-nodes';
import {
  DEFAULT_BROWSER_CONTEXT_DIR_NAME,
  WALLET_PAGES,
} from './browser.constants';
import {
  BrowserContextService,
  BrowserOptions,
} from './browser.context.service';
import { mnemonicToAccount } from 'viem/accounts';
import { test } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';

type NodeConfig = {
  rpcUrlToMock: string; // example: '**/api/rpc?chainId=1'
};

type BrowserServiceOptions = {
  networkConfig: NetworkConfig;
  accountConfig: AccountConfig;
  walletConfig: CommonWalletConfig;
  nodeConfig: NodeConfig;
  browserOptions?: BrowserOptions;
};

export class BrowserService {
  private logger = new ConsoleLogger(BrowserService.name);
  private walletPage: WalletPage<WalletTypes.WC | WalletTypes.EOA>;
  private browserContextService: BrowserContextService;
  public ethereumNodeService: EthereumNodeService;

  public isFork: boolean;

  constructor(private options: BrowserServiceOptions) {}

  getWalletPage() {
    if (!this.walletPage)
      this.logger.error(
        '"walletPage" is not initialized. Use initWalletSetup() function',
      );
    return this.walletPage;
  }

  getBrowserContext() {
    return this.browserContextService.browserContext;
  }

  getBrowserContextPage() {
    return this.browserContextService.browserContext.pages()[0];
  }

  async initWalletSetup(useFork?: boolean) {
    this.isFork = useFork;
    if (useFork) {
      await this.setupWithNode();
    } else {
      await this.setup();
      await this.walletPage.setupNetwork(this.options.networkConfig);
      await this.walletPage.changeNetwork(this.options.networkConfig.chainName);
      await this.browserContextService.closePages();
    }
  }

  async setupWithNode() {
    this.ethereumNodeService = new EthereumNodeService({
      chainId: this.options.networkConfig.chainId,
      rpcUrl: this.options.networkConfig.rpcUrl,
      defaultBalance: 100,
    });
    await this.ethereumNodeService.startNode();
    const account = this.ethereumNodeService.getAccount();
    await this.setup();
    if (!(await this.walletPage.isWalletAddressExist(account.address))) {
      await this.walletPage.importKey(account.secretKey);
    } else {
      await this.walletPage.changeWalletAccountByName(account.address);
    }

    await this.walletPage.setupNetwork({
      ...this.options.networkConfig,
      chainName: this.options.networkConfig.chainName,
      rpcUrl: this.ethereumNodeService.state.nodeUrl,
    });

    await this.ethereumNodeService.mockRoute(
      this.options.nodeConfig.rpcUrlToMock,
      this.browserContextService.browserContext,
    );
    await this.browserContextService.closePages();
  }

  async setup() {
    const extensionService = new ExtensionService();

    const extensionPath = await extensionService.getExtensionDirFromId(
      this.options.walletConfig.STORE_EXTENSION_ID,
      this.options.walletConfig.LATEST_STABLE_DOWNLOAD_LINK,
    );

    const contextDataDir =
      !this.ethereumNodeService?.state &&
      `${DEFAULT_BROWSER_CONTEXT_DIR_NAME}_${
        mnemonicToAccount(this.options.accountConfig.SECRET_PHRASE).address
      }_${this.options.walletConfig.WALLET_NAME}`;
    this.browserContextService = new BrowserContextService(extensionPath, {
      contextDataDir,
      browserOptions: this.options.browserOptions,
    });

    await this.browserContextService.initBrowserContext();

    if (
      this.options.walletConfig.WALLET_TYPE === WalletTypes.EOA &&
      !!process.env.CI
    ) {
      const manifestContent = await extensionService.getManifestContent(
        this.options.walletConfig.STORE_EXTENSION_ID,
      );
      test.info().annotations.push({
        type: 'wallet version',
        description: manifestContent.version,
      });
    }

    const extension = new Extension(this.browserContextService.extensionId);

    const extensionWalletPage = new WALLET_PAGES[
      this.options.walletConfig.EXTENSION_WALLET_NAME
    ](
      this.browserContextService.browserContext,
      extension.url,
      this.options.accountConfig,
      this.options.walletConfig,
    );
    await extensionWalletPage.setup(this.options.networkConfig.chainName);

    if (this.options.walletConfig.WALLET_TYPE === WalletTypes.WC) {
      this.walletPage = new WALLET_PAGES[this.options.walletConfig.WALLET_NAME](
        this.browserContextService.browserContext,
        extensionWalletPage,
        this.options.networkConfig.chainId,
        this.options.accountConfig,
        this.options.walletConfig,
      );
    } else {
      this.walletPage = extensionWalletPage;
    }
  }

  async teardown() {
    if (this.browserContextService.browserContext !== null)
      await this.browserContextService.browserContext.close();
    if (this.ethereumNodeService) {
      await this.ethereumNodeService.stopNode();
    }
  }
}
