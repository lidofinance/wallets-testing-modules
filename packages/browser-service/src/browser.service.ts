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
import {
  Account,
  EthereumNodeService,
} from '@lidofinance/wallets-testing-nodes';
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

type NodeConfig = {
  rpcUrlToMock: string; // example: '**/api/rpc?chainId=1'
};

type BrowserServiceOptions = {
  networkConfig: NetworkConfig;
  walletConfig: WalletConfig;
  nodeConfig: NodeConfig;
  browserOptions?: BrowserOptions;
  useTmpContextDir?: boolean;
};

export class BrowserService {
  private options: BrowserServiceOptions;

  private walletPage: WalletPage<WalletTypes.EOA>;
  private account: Account;
  private browserContextService: BrowserContextService;

  public isFork: boolean;

  constructor(
    options: BrowserServiceOptions,
    private ethereumNodeService?: EthereumNodeService,
  ) {
    this.browserContextService = new BrowserContextService();
    this.options = options;
  }

  getWalletPage() {
    return this.walletPage;
  }

  async getBrowserContext() {
    return this.browserContextService.browserContext;
  }

  async getBrowserContextPage() {
    return this.browserContextService.getBrowserContextPage();
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
    this.account = this.ethereumNodeService.state.accounts[0];
    await this.setup();
    if (!(await this.walletPage.isWalletAddressExist(this.account.address))) {
      await this.walletPage.importKey(this.account.secretKey);
    } else {
      await this.walletPage.changeWalletAccountByName(this.account.address);
    }

    await this.walletPage.setupNetwork({
      ...this.options.networkConfig,
      chainName: this.options.networkConfig.chainName,
      rpcUrl: this.ethereumNodeService.state.nodeUrl,
    });

    await this.ethereumNodeService.mockRoute(
      this.options.nodeConfig.rpcUrlToMock, // '**/api/rpc?chainId=1',
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

    await this.browserContextService.setup(extensionPath, {
      // If fork was started we send to browserContextService set up separetly context
      // but, if fork wasnt started we send custom directory for create share context.
      contextDataDir:
        !this.ethereumNodeService?.state &&
        !this.options.useTmpContextDir &&
        `${DEFAULT_BROWSER_CONTEXT_DIR_NAME}_${
          mnemonicToAccount(this.options.walletConfig.SECRET_PHRASE).address
        }`,
      browserOptions: this.options.browserOptions,
    });

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
    await this.setupEoaWallet(extensionWalletPage);

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

  async setupEoaWallet(wallet: WalletPage<WalletTypes.EOA>) {
    await wallet.setup('Ethereum'); // @TODO: instead this.widgetConfig.networkName
    await this.browserContextService.closePages();
  }
}
