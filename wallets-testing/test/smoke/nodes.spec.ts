import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EthereumNodeService } from '@lidofinance/wallets-testing-nodes';
import { MATIC_TOKEN } from './consts';
import { prepareNodeModule } from '../../commons';
import { test, expect } from '@playwright/test';

test.describe('Ethereum node', () => {
  let app: INestApplication;
  let ethereumNodeService: EthereumNodeService;

  test.beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [prepareNodeModule()],
    }).compile();

    app = moduleFixture.createNestApplication();
    ethereumNodeService =
      moduleFixture.get<EthereumNodeService>(EthereumNodeService);
    await app.init();
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
