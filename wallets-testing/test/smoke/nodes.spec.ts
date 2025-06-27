import { EthereumNodeService } from '@lidofinance/wallets-testing-nodes';
import { MATIC_TOKEN } from './consts';
import { test, expect } from '@playwright/test';
import { getWidgetConfig } from '../../config';

test.describe('Ethereum node', () => {
  let ethereumNodeService: EthereumNodeService;

  test.beforeEach(async () => {
    const widgetConfig = getWidgetConfig['Ethereum Mainnet'];
    ethereumNodeService = new EthereumNodeService({
      chainId: widgetConfig.network.chainId,
      rpcUrl: widgetConfig.network.rpcUrl,
      defaultBalance: 1000,
    });
  });

  test('should init', async () => {
    await ethereumNodeService.startNode();
    expect(ethereumNodeService.state).toBeDefined();
    const account = ethereumNodeService.state.accounts[0];
    expect(await ethereumNodeService.getBalance(account)).toEqual('1000.0');
  });

  test('should set ERC20 balance', async () => {
    await ethereumNodeService.startNode();
    expect(ethereumNodeService.state).toBeDefined();
    const account = ethereumNodeService.state.accounts[0];
    expect(
      (
        await ethereumNodeService.setErc20Balance(account, MATIC_TOKEN, 0, 100)
      ).toString(),
    ).toEqual('100');
  });

  test.afterEach(async () => {
    await ethereumNodeService.stopNode();
  });
});
