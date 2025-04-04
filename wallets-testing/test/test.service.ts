import { configService } from '../config';
import { ETHEREUM_WIDGET_CONFIG } from '@lidofinance/wallets-testing-widgets';
import { BrowserService } from '@lidofinance/browser-service';
import { METAMASK_COMMON_CONFIG } from '@lidofinance/wallets-testing-wallets';

export async function initBrowserService() {
  METAMASK_COMMON_CONFIG.LATEST_STABLE_DOWNLOAD_LINK = undefined;
  return new BrowserService({
    networkConfig: {
      chainId: ETHEREUM_WIDGET_CONFIG.chainId,
      chainName: ETHEREUM_WIDGET_CONFIG.chainName,
      tokenSymbol: ETHEREUM_WIDGET_CONFIG.tokenSymbol,
      rpcUrl: configService.get('RPC_URL'),
      scan: 'https://etherscan.io/',
    },
    walletConfig: {
      SECRET_PHRASE: configService.get('WALLET_SECRET_PHRASE'),
      PASSWORD: configService.get('WALLET_PASSWORD'),
      COMMON: METAMASK_COMMON_CONFIG,
      NETWORK_NAME: ETHEREUM_WIDGET_CONFIG.networkName,
    },
    nodeConfig: {
      rpcUrlToMock: ETHEREUM_WIDGET_CONFIG.nodeUrl,
    },
    browserOptions: {
      slowMo: 200,
    },
  });
}
