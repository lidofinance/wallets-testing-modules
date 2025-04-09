import {
  CommonWalletConfig,
  NetworkConfig,
  WalletConfig,
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
import { Page, test } from '@playwright/test';

type NodeConfig = {
  rpcUrlToMock: string; // example: '**/api/rpc?chainId=1'
};

type BrowserServiceOptions = {
  networkConfig: NetworkConfig;
  walletConfig: WalletConfig;
  nodeConfig: NodeConfig;
  browserOptions?: BrowserOptions;
  enableBrowserContext?: boolean;
};

export class BrowserService {
  private walletPage: WalletPage<WalletTypes.EOA>;
  private browserContextService: BrowserContextService;
  private browserContextPage: Page;
  public ethereumNodeService: EthereumNodeService;

  public isFork: boolean;

  constructor(private options: BrowserServiceOptions) {}

  getWalletPage() {
    return this.walletPage;
  }

  async getBrowserContext() {
    return this.browserContextService.browserContext;
  }

  async getBrowserContextPage() {
    return this.browserContextPage;
  }

  async initWalletSetup(useFork?: boolean) {
    if (useFork) {
      await this.setupWithNode();
    } else {
      await this.setup();
      await this.walletPage.setupNetwork(this.options.networkConfig);
      await this.walletPage.changeNetwork(this.options.networkConfig.chainName);
      await this.browserContextService.closePages();
    }
    this.isFork = !!this.ethereumNodeService;
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

  async setup(commonWalletConfig?: CommonWalletConfig) {
    const walletConfig = {
      ...this.options.walletConfig,
      COMMON: commonWalletConfig || this.options.walletConfig.COMMON,
    };

    const extensionService = new ExtensionService();

    const extensionPath = await extensionService.getExtensionDirFromId(
      walletConfig.COMMON.STORE_EXTENSION_ID,
      walletConfig.COMMON.LATEST_STABLE_DOWNLOAD_LINK,
    );

    // If fork was started we send to browserContextService set up separetly context
    // but, if fork wasnt started we send custom directory for create share context.
    const isCustomDirNeeded =
      !this.ethereumNodeService?.state && this.options.enableBrowserContext;
    const contextDataDir =
      isCustomDirNeeded &&
      `${DEFAULT_BROWSER_CONTEXT_DIR_NAME}_${
        mnemonicToAccount(walletConfig.SECRET_PHRASE).address
      }`;
    this.browserContextService = new BrowserContextService(extensionPath, {
      contextDataDir,
      browserOptions: this.options.browserOptions,
    });

    this.browserContextPage =
      await this.browserContextService.initBrowserContext();

    if (
      walletConfig.COMMON.WALLET_TYPE === WalletTypes.EOA &&
      !!process.env.CI
    ) {
      const manifestContent = await extensionService.getManifestContent(
        walletConfig.COMMON.STORE_EXTENSION_ID,
      );
      test.info().annotations.push({
        type: 'wallet version',
        description: manifestContent.version,
      });
    }

    const extension = new Extension(this.browserContextService.extensionId);

    const extensionWalletPage = new WALLET_PAGES[
      walletConfig.COMMON.EXTENSION_WALLET_NAME
    ](this.browserContextService.browserContext, extension.url, walletConfig);
    await extensionWalletPage.setup(walletConfig.NETWORK_NAME);

    if (walletConfig.COMMON.WALLET_TYPE === WalletTypes.WC) {
      this.walletPage = new WALLET_PAGES[walletConfig.COMMON.WALLET_NAME](
        this.browserContextService.browserContext,
        extensionWalletPage,
        this.options.networkConfig.chainId,
        walletConfig,
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
