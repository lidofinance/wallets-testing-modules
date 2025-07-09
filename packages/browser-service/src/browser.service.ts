import {
  AccountConfig,
  CommonWalletConfig,
  NetworkConfig,
  WalletPage,
  WalletConnectTypes,
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
  standUrl: string;
  browserOptions?: BrowserOptions;
};

/**
 * Required options depends on `WalletConnectTypes`:
 * - `WalletConnectType.EOA` and `WalletConnectType.WC`:
 *   - networkConfig
 *   - accountConfig
 *   - walletConfig
 *   - nodeConfig
 *   - browserOptions?
 * - `WalletConnectType.IFRAME`:
 *   - networkConfig
 *   - accountConfig
 *   - walletConfig
 *   - nodeConfig
 *   - standUrl
 *   - browserOptions?
 */
export class BrowserService {
  private logger = new ConsoleLogger(BrowserService.name);
  private walletPage: WalletPage<
    WalletConnectTypes.WC | WalletConnectTypes.EOA | WalletConnectTypes.IFRAME
  >;
  private browserContextService: BrowserContextService;
  public ethereumNodeService: EthereumNodeService;

  public readonly networkConfig: NetworkConfig;
  public readonly walletConfig: CommonWalletConfig;
  public isFork: boolean;

  constructor(private options: BrowserServiceOptions) {
    this.networkConfig = options.networkConfig;
    this.walletConfig = options.walletConfig;
  }

  getWalletPage() {
    if (!this.walletPage)
      this.logger.error(
        '"walletPage" is not initialized. Use initWalletSetup() function',
      );
    return this.walletPage;
  }

  getBrowserContextPage() {
    return this.browserContextService.browserContext.pages()[0];
  }

  async initWalletSetup(useFork?: boolean) {
    if (useFork) {
      await this.setupWithNode();
    } else {
      await this.setup();
      await this.walletPage.setupNetwork(this.options.networkConfig);
      await this.browserContextService.closePages();
    }
  }

  async setupWithNode() {
    this.isFork = true;
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
      await this.walletPage.changeWalletAccountByAddress(account.address);
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
    await this.annotateExtensionWalletVersion(extensionService);
    this.setWalletPage();
    await this.walletPage.setup();
  }

  async teardown() {
    if (this.browserContextService.browserContext !== null)
      await this.browserContextService.browserContext.close();
    if (this.ethereumNodeService) {
      await this.ethereumNodeService.stopNode();
    }
  }

  private setWalletPage() {
    const extension = new Extension(this.browserContextService.extensionId);
    const extensionWalletPage = new WALLET_PAGES[
      this.options.walletConfig.EXTENSION_WALLET_NAME
    ]({
      browserContext: this.browserContextService.browserContext,
      extensionUrl: extension.url,
      accountConfig: this.options.accountConfig,
      walletConfig: this.options.walletConfig,
      standConfig: {
        standUrl: this.options.standUrl,
      },
    });

    switch (this.options.walletConfig.WALLET_TYPE) {
      case WalletConnectTypes.WC:
      case WalletConnectTypes.IFRAME:
        this.walletPage = new WALLET_PAGES[
          this.options.walletConfig.WALLET_NAME
        ]({
          browserContext: this.browserContextService.browserContext,
          extensionPage: extensionWalletPage,
          walletConfig: this.options.walletConfig,
          standConfig: {
            chainId: this.options.networkConfig.chainId,
            standUrl: this.options.standUrl,
            rpcUrl:
              this.ethereumNodeService?.state.nodeUrl ||
              this.options.networkConfig.rpcUrl,
          },
        });
        break;
      default:
        this.walletPage = extensionWalletPage;
    }
  }

  private async annotateExtensionWalletVersion(
    extensionService: ExtensionService,
  ) {
    const manifestContent = await extensionService.getManifestContent(
      this.options.walletConfig.STORE_EXTENSION_ID,
    );
    test.info().annotations.push({
      type: `${this.options.walletConfig.EXTENSION_WALLET_NAME} wallet version`,
      description: manifestContent.version,
    });
  }
}
