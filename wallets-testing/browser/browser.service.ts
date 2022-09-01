import { Injectable, Logger } from '@nestjs/common';
import {
  CommonWalletConfig,
  WalletConfig,
  WalletPage,
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
  private walletPage: WalletPage;
  private account: Account;
  private widgetConfig: WidgetConfig;
  private stakeConfig: StakeConfig;

  constructor(
    private extensionService: ExtensionService,
    private browserContextService: BrowserContextService,
    private configService: ConfigService,
    private ethereumNodeService: EthereumNodeService,
  ) {}

  async setup(
    commonWalletConfig: CommonWalletConfig,
    widgetConfig: WidgetConfig,
    stakeConfig?: StakeConfig,
  ) {
    this.widgetConfig = widgetConfig;
    this.stakeConfig = stakeConfig;
    await this.ethereumNodeService.startNode();
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
    this.walletPage = new WALLET_PAGES[commonWalletConfig.WALLET_NAME](
      this.browserContextService.browserContext,
      extension.url,
      walletConfig,
    );
    this.account = this.ethereumNodeService.state.accounts[0];
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
    await this.walletPage.setup();
    await this.walletPage.importKey(this.account.secretKey);
    await this.browserContextService.closePages();
  }

  async stake(): Promise<string> {
    try {
      const widgetPage = new WIDGET_PAGES[this.widgetConfig.name](
        await this.browserContextService.browserContext.newPage(),
        this.stakeConfig || {},
      );
      await widgetPage.navigate();
      await widgetPage.connectWallet(this.walletPage);
      await widgetPage.doStaking(this.walletPage);
    } finally {
      await this.browserContextService.closePages();
    }
    return (
      'Success. Account balance is ' +
      (await this.ethereumNodeService.getBalance(this.account))
    );
  }

  async connectWallet(): Promise<string> {
    try {
      const widgetPage = new WIDGET_PAGES[this.widgetConfig.name](
        await this.browserContextService.browserContext.newPage(),
        this.widgetConfig || {},
      );
      await widgetPage.navigate();
      await widgetPage.connectWallet(this.walletPage);
    } finally {
      await this.browserContextService.closePages();
    }
    return `Success. Wallet ${this.walletPage.config.COMMON.WALLET_NAME} successfully connected`;
  }

  async teardown() {
    if (this.browserContextService.browserContext !== null)
      await this.browserContextService.browserContext.close();
    await this.ethereumNodeService.stopNode();
  }
}
