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
  private walletPage: WalletPage<WalletTypes>;
  private wcExtensionHelperWallet?: WalletPage<WalletTypes.EOA>;
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
    await this.setup(
      commonWalletConfig,
      widgetConfig,
      stakeConfig,
      this.ethereumNodeService.state.nodeUrl,
    );
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
  }

  async setup(
    commonWalletConfig: CommonWalletConfig,
    widgetConfig: WidgetConfig,
    stakeConfig?: StakeConfig,
    forkNodeUrl?: string,
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

    switch (commonWalletConfig.WALLET_TYPE) {
      case WalletTypes.EOA: {
        this.walletPage = new WALLET_PAGES[
          commonWalletConfig.EXTENSION_WALLET_NAME
        ](
          this.browserContextService.browserContext,
          extension.url,
          walletConfig,
        );
        // reuse setupEoaWallet
        await this.setupEoaWallet(this.walletPage);
        break;
      }
      case WalletTypes.WC: {
        this.wcExtensionHelperWallet = new WALLET_PAGES[
          commonWalletConfig.EXTENSION_WALLET_NAME
        ](
          this.browserContextService.browserContext,
          extension.url,
          walletConfig,
        );

        //testing wallet setup
        this.walletPage = new WALLET_PAGES[commonWalletConfig.WALLET_NAME](
          this.browserContextService.browserContext,
          this.wcExtensionHelperWallet,
          this.widgetConfig.chainId,
          walletConfig,
        );

        // helper wallet  setup
        await this.wcExtensionHelperWallet.setup(this.widgetConfig.networkName);
        // reuse
        await this.setupEoaWallet(this.wcExtensionHelperWallet);
        break;
      }
    }
  }

  async stake(): Promise<string> {
    try {
      const widgetPage = new WIDGET_PAGES[this.widgetConfig.name](
        this.browserContextService.browserContext.pages()[0],
        this.stakeConfig || {},
      );
      await widgetPage.navigate();
      await widgetPage.connectWallet(this.walletPage);
      await widgetPage.doStaking();
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
    await widgetPage.connectWallet(this.walletPage);

    return `Success. Wallet ${this.walletPage.config.COMMON.WALLET_NAME} successfully connected`;
  }

  async teardown() {
    if (this.browserContextService.browserContext !== null)
      await this.browserContextService.browserContext.close();
    await this.ethereumNodeService.stopNode();
  }

  async setupEoaWallet(wallet: WalletPage<WalletTypes.EOA>) {
    await wallet.setup(this.widgetConfig.networkName);

    let forkUrl = undefined;
    if (this.ethereumNodeService.state) {
      await wallet.importKey(this.account.secretKey);
      forkUrl = this.ethereumNodeService.state.nodeUrl;
    }

    const needsCustomNetwork = forkUrl || !this.widgetConfig.isDefaultNetwork;
    if (needsCustomNetwork)
      await wallet.addNetwork({
        chainName: this.widgetConfig.chainName,
        rpcUrl:
          this.ethereumNodeService.state.nodeUrl || this.widgetConfig.nodeUrl,
        chainId: this.widgetConfig.chainId,
        tokenSymbol: this.widgetConfig.tokenSymbol,
        scan: '',
      });
    await this.browserContextService.closePages();
  }
}
