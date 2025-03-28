import { configService } from '../config';
import { ETHEREUM_WIDGET_CONFIG } from '@lidofinance/wallets-testing-widgets';
import { BrowserService } from '@lidofinance/browser-service';
import { METAMASK_COMMON_CONFIG } from '@lidofinance/wallets-testing-wallets';

export async function initBrowserService() {
  return new BrowserService({
    networkConfig: {
      chainId: ETHEREUM_WIDGET_CONFIG.chainId,
      chainName: ETHEREUM_WIDGET_CONFIG.chainName,
      tokenSymbol: ETHEREUM_WIDGET_CONFIG.tokenSymbol,
      rpcUrl: configService.get('RPC_URL'),
      scan: 'https://etherscan.io/', // TODO: take from config
    },
    walletConfig: {
      SECRET_PHRASE: configService.get('WALLET_SECRET_PHRASE'),
      PASSWORD: configService.get('WALLET_PASSWORD'),
      COMMON: METAMASK_COMMON_CONFIG,
    },
    nodeConfig: { rpcUrlToMock: '**/api/rpc?chainId=1' }, // TODO: make dynamic chainId
    useTmpContextDir: true,
    browserOptions: {
      slowMo: 200,
    },
  });
}
