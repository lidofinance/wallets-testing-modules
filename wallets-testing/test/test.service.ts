import { configService } from '../config';
import { EthereumNodeService } from '@lidofinance/wallets-testing-nodes';
import { ETHEREUM_WIDGET_CONFIG } from '@lidofinance/wallets-testing-widgets';
import { ExtensionService } from '@lidofinance/wallets-testing-extensions';
import { BrowserContextService, BrowserService } from '../browser';

export async function initBrowserService() {
  const ethereumNodeService = new EthereumNodeService({
    chainId: ETHEREUM_WIDGET_CONFIG.chainId,
    rpcUrl: configService.get('RPC_URL'),
    defaultBalance: 1000,
  });
  const extensionService = new ExtensionService();
  return new BrowserService(
    extensionService,
    new BrowserContextService(ethereumNodeService, extensionService),
    ethereumNodeService,
  );
}
