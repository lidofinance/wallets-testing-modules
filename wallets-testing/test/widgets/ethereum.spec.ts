import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { prepareNodeModule } from '../../commons';
import {
  COIN98_COMMON_CONFIG,
  MATHWALLET_COMMON_CONFIG,
  METAMASK_COMMON_CONFIG,
  GAMESTOP_COMMON_CONFIG,
  TRUST_WALLET_COMMON_CONFIG,
  COINBASE_COMMON_CONFIG,
  TALLY_COMMON_CONFIG,
  EXODUS_COMMON_CONFIG,
  XDEFI_COMMON_CONFIG,
} from '@lidofinance/wallets-testing-wallets';
import { ETHEREUM_WIDGET_CONFIG } from '@lidofinance/wallets-testing-widgets';
import { BrowserModule } from '../../browser/browser.module';
import { BrowserService } from '../../browser/browser.service';
import { test } from '@playwright/test';

test.describe('Ethereum widget testing', () => {
  let app: INestApplication;
  let browserService: BrowserService;

  test.beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [prepareNodeModule(), BrowserModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    browserService = moduleFixture.get<BrowserService>(BrowserService);
  });

  test(`Metamask wallet stake`, async () => {
    await browserService.setupWithNode(
      METAMASK_COMMON_CONFIG,
      ETHEREUM_WIDGET_CONFIG,
      {
        stakeAmount: 100,
      },
    );
    await browserService.stake();
  });

  test(`Coin98 wallet connect`, async () => {
    await browserService.setup(COIN98_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Mathwallet wallet connect`, async () => {
    await browserService.setup(
      MATHWALLET_COMMON_CONFIG,
      ETHEREUM_WIDGET_CONFIG,
    );
    await browserService.connectWallet();
  });

  test(`GameStop wallet connect`, async () => {
    await browserService.setup(GAMESTOP_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Exodus wallet connect`, async () => {
    await browserService.setup(EXODUS_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Trust wallet connect`, async () => {
    await browserService.setup(
      TRUST_WALLET_COMMON_CONFIG,
      ETHEREUM_WIDGET_CONFIG,
    );
    await browserService.connectWallet();
  });

  test(`Coinbase wallet connect`, async () => {
    await browserService.setup(COINBASE_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Tally wallet connect`, async () => {
    await browserService.setup(TALLY_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Xdefi wallet connect`, async () => {
    await browserService.setup(XDEFI_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test.afterEach(async () => {
    await browserService.teardown();
  });
});
