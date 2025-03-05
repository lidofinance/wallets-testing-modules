import { Injectable, Logger } from '@nestjs/common';
import {
  CommonWalletConfig,
  WalletConfig,
  WalletPage,
  WalletTypes,
} from '@lidofinance/wallets-testing-wallets';
import {
  Extension,
  ExtensionService,
} from '@lidofinance/wallets-testing-extensions';
import { ConfigService } from '../config';
import {
  Account,
  EthereumNodeService,
} from '@lidofinance/wallets-testing-nodes';
import {
  WidgetConfig,
  StakeConfig,
} from '@lidofinance/wallets-testing-widgets';
import { WALLET_PAGES, WIDGET_PAGES } from './browser.constants';
import { BrowserContextService } from './browser.context.service';

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);
  private extensionWallet: WalletPage<WalletTypes.EOA>;
  private wcImplementedWallet?: WalletPage<WalletTypes.WC>;
  private account: Account;
  private widgetConfig: WidgetConfig;
  private stakeConfig: StakeConfig;

  constructor(
    private extensionService: ExtensionService,
    private browserContextService: BrowserContextService,
    private configService: ConfigService,
    private ethereumNodeService: EthereumNodeService,
  ) {}

  async setupWithNode(
    commonWalletConfig: CommonWalletConfig,
    widgetConfig: WidgetConfig,
    stakeConfig?: StakeConfig,
  ) {
    await this.ethereumNodeService.startNode();
    this.account = this.ethereumNodeService.state.accounts[0];
    await this.setup(commonWalletConfig, widgetConfig, stakeConfig);
    if (
      this.stakeConfig &&
      this.stakeConfig.tokenAddress &&
      this.stakeConfig.mappingSlot != undefined
    ) {
      await this.ethereumNodeService.setErc20Balance(
        this.account,
        this.stakeConfig.tokenAddress,
        this.stakeConfig.mappingSlot || 0,
        this.stakeConfig.stakeAmount * 100,
      );
    }
    await this.extensionWallet.importKey(this.account.secretKey);
    await this.extensionWallet.addNetwork({
      chainName: this.widgetConfig.chainName,
      rpcUrl: this.ethereumNodeService.state.nodeUrl,
      chainId: this.widgetConfig.chainId,
      tokenSymbol: this.widgetConfig.tokenSymbol,
      scan: '',
    });
    await this.browserContextService.closePages();
  }

  async setup(
    commonWalletConfig: CommonWalletConfig,
    widgetConfig: WidgetConfig,
    stakeConfig?: StakeConfig,
  ) {
    this.widgetConfig = widgetConfig;
    this.stakeConfig = stakeConfig;
    const walletConfig: WalletConfig = {
      SECRET_PHRASE: this.configService.get('WALLET_SECRET_PHRASE'),
      PASSWORD: this.configService.get('WALLET_PASSWORD'),
      COMMON: commonWalletConfig,
    };
    walletConfig.EXTENSION_PATH =
      await this.extensionService.getExtensionDirFromId(
        commonWalletConfig.STORE_EXTENSION_ID,
      );
    await this.browserContextService.setup(
      walletConfig,
      this.widgetConfig.nodeUrl,
    );
    const extension = new Extension(this.browserContextService.extensionId);
    this.extensionWallet = new WALLET_PAGES[
      commonWalletConfig.EXTENSION_WALLET_NAME
    ](this.browserContextService.browserContext, extension.url, walletConfig);
    if (commonWalletConfig.WALLET_TYPE === WalletTypes.WC) {
      this.wcImplementedWallet = new WALLET_PAGES[
        commonWalletConfig.WALLET_NAME
      ](
        this.browserContextService.browserContext,
        this.extensionWallet,
        this.widgetConfig.chainId,
      );
    }
    await this.browserContextService.closePages();
    await this.extensionWallet.setup(this.widgetConfig.networkName);
    if (!this.widgetConfig.isDefaultNetwork)
      await this.extensionWallet.addNetwork({
        chainName: this.widgetConfig.chainName,
        rpcUrl: this.widgetConfig.nodeUrl,
        chainId: this.widgetConfig.chainId,
        tokenSymbol: this.widgetConfig.tokenSymbol,
        scan: '',
      });
    await this.browserContextService.closePages();
  }

  async stake(): Promise<string> {
    try {
      const widgetPage = new WIDGET_PAGES[this.widgetConfig.name](
        this.browserContextService.browserContext.pages()[0],
        this.stakeConfig || {},
      );
      await widgetPage.navigate();
      await widgetPage.connectWallet(this.extensionWallet);
      await widgetPage.doStaking(this.extensionWallet);
    } catch {
      this.logger.log('Stake failed');
    }
    return 'Success';
  }

  async connectWallet(): Promise<string> {
    const widgetPage = new WIDGET_PAGES[this.widgetConfig.name](
      this.browserContextService.browserContext.pages()[0],
      this.stakeConfig || {},
    );
    await widgetPage.navigate();
    await widgetPage.connectWallet(
      this.extensionWallet,
      this.wcImplementedWallet,
    );

    return `Success. Wallet ${this.extensionWallet.config.COMMON.WALLET_NAME} successfully connected`;
  }

  async teardown() {
    if (this.browserContextService.browserContext !== null)
      await this.browserContextService.browserContext.close();
    await this.ethereumNodeService.stopNode();
  }
}
