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
import {
  EthereumNodeService,
  EthereumNodeServiceOptions,
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
import { ConsoleLogger } from '@nestjs/common';

type BrowserServiceOptions = {
  networkConfig: NetworkConfig;
  accountConfig: AccountConfig;
  walletConfig: CommonWalletConfig;
  nodeConfig?: EthereumNodeServiceOptions;
  standUrl?: string;
  browserOptions?: BrowserOptions;
};

/**
 * Required options depends on `WalletConnectTypes`:
 * - `WalletConnectType.EOA` and `WalletConnectType.WC_EOA`:
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
  private walletPage: WalletPage;
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
    this.ethereumNodeService = new EthereumNodeService(this.options.nodeConfig);

    if (useFork) {
      await this.setupWithNode();
    } else {
      await this.setup();
      await this.walletPage.setupNetwork(this.options.networkConfig);
      await this.walletPage.changeNetwork(this.options.networkConfig.chainName);
      await this.browserContextService.closePages();
    }

    await this.ethereumNodeService.mockRoute(
      this.options.nodeConfig.mockConfig.rpcUrlToMock,
      this.browserContextService.browserContext,
    );
  }

  async setupWithNode() {
    this.isFork = true;
    await this.ethereumNodeService.startNode();
    await this.ethereumNodeService.setupDefaultTokenBalances();
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
    await this.browserContextService.closePages();
  }

  async setup() {
    let extensionPath, extensionService, contextDataDir;

    if (this.options.walletConfig?.STORE_EXTENSION_ID) {
      extensionService = new ExtensionService();

      extensionPath = await extensionService.getExtensionDirFromId(
        this.options.walletConfig.STORE_EXTENSION_ID,
        this.options.walletConfig.LATEST_STABLE_DOWNLOAD_LINK,
      );

      contextDataDir = `${DEFAULT_BROWSER_CONTEXT_DIR_NAME}_${
        mnemonicToAccount(this.options.accountConfig.SECRET_PHRASE).address
      }_isFork-${this.isFork}_${this.options.walletConfig.WALLET_NAME}`;
    }

    this.browserContextService = new BrowserContextService(extensionPath, {
      contextDataDir,
      browserOptions: this.options.browserOptions,
    });

    await this.browserContextService.initBrowserContext();
    if (this.options.walletConfig?.STORE_EXTENSION_ID) {
      await this.annotateExtensionWalletVersion(extensionService);
    }
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
    const buildExtensionWalletPage = () => {
      const extension = new Extension(this.browserContextService.extensionId);

      return new WALLET_PAGES[this.options.walletConfig.EXTENSION_WALLET_NAME]({
        browserContext: this.browserContextService.browserContext,
        extensionUrl: extension.url,
        accountConfig: this.options.accountConfig,
        walletConfig: this.options.walletConfig,
      });
    };

    const standConfig = {
      chainId: this.options.networkConfig.chainId,
      standUrl: this.options.standUrl,
      rpcUrl:
        this.ethereumNodeService?.state?.nodeUrl ||
        this.options.networkConfig.rpcUrl,
    };

    switch (this.options.walletConfig.WALLET_TYPE) {
      case WalletConnectTypes.WC_EOA:
      case WalletConnectTypes.IFRAME:
        this.walletPage = new WALLET_PAGES[
          this.options.walletConfig.WALLET_NAME
        ]({
          browserContext: this.browserContextService.browserContext,
          extensionPage: buildExtensionWalletPage(),
          walletConfig: this.options.walletConfig,
          standConfig,
        });
        break;
      case WalletConnectTypes.WC_SDK:
        this.walletPage = new WALLET_PAGES[
          this.options.walletConfig.WALLET_NAME
        ]({
          browserContext: this.browserContextService.browserContext,
          walletConfig: this.options.walletConfig,
          accountConfig: this.options.accountConfig,
          standConfig,
        });
        break;
      default:
        this.walletPage = buildExtensionWalletPage();
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
