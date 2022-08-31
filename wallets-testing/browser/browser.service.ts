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
  WidgetPage,
} from '@lidofinance/wallets-testing-widgets';
import { WALLET_PAGES, WIDGET_PAGES } from './browser.constants';
import { BrowserContextService } from './browser.context.service';

@Injectable()
export class BrowserService {
  private readonly logger = new Logger(BrowserService.name);
  private walletPage: WalletPage;
  private widgetPage: WidgetPage;
  private account: Account;

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
      widgetConfig.nodeUrl,
    );
    const extension = new Extension(this.browserContextService.extensionId);
    this.walletPage = new WALLET_PAGES[commonWalletConfig.WALLET_NAME](
      this.browserContextService.browserContext,
      extension.url,
      walletConfig,
    );
    this.account = this.ethereumNodeService.state.accounts[0];
    this.widgetPage = new WIDGET_PAGES[widgetConfig.name](
      await this.browserContextService.browserContext.newPage(),
      widgetConfig || {},
    );
    if (widgetConfig && stakeConfig.tokenAddress && stakeConfig.mappingSlot) {
      await this.ethereumNodeService.setErc20Balance(
        this.account,
        stakeConfig.tokenAddress,
        stakeConfig.mappingSlot || 0,
        stakeConfig.stakeAmount * 100,
      );
    }
    await this.walletPage.setup();
    await this.walletPage.importKey(this.account.secretKey);
    await this.browserContextService.closePages();
  }

  async stake(): Promise<string> {
    try {
      await this.widgetPage.navigate();
      await this.widgetPage.connectWallet(this.walletPage);
      await this.widgetPage.doStaking(this.walletPage);
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
      await this.widgetPage.navigate();
      await this.widgetPage.connectWallet(this.walletPage);
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
