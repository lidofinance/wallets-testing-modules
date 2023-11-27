import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { prepareNodeModule } from '../../commons';
import {
  COIN98_COMMON_CONFIG,
  METAMASK_COMMON_CONFIG,
  TRUST_WALLET_COMMON_CONFIG,
  COINBASE_COMMON_CONFIG,
  TAHO_COMMON_CONFIG,
  EXODUS_COMMON_CONFIG,
  XDEFI_COMMON_CONFIG,
  OKX_COMMON_CONFIG,
  BITGET_COMMON_CONFIG,
  PHANTOM_COMMON_CONFIG,
} from '@lidofinance/wallets-testing-wallets';
import { ETHEREUM_WIDGET_CONFIG } from '@lidofinance/wallets-testing-widgets';
import { BrowserModule } from '../../browser/browser.module';
import { BrowserService } from '../../browser/browser.service';
import { test } from '@playwright/test';

test.describe('Ethereum', () => {
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

  test(`Metamask stake`, async () => {
    await browserService.setupWithNode(
      METAMASK_COMMON_CONFIG,
      ETHEREUM_WIDGET_CONFIG,
      {
        stakeAmount: 100,
      },
    );
    await browserService.stake();
  });

  test(`Coin98 connect`, async () => {
    await browserService.setup(COIN98_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test.skip(`Exodus connect`, async () => {
    await browserService.setup(EXODUS_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Trust connect`, async () => {
    await browserService.setup(
      TRUST_WALLET_COMMON_CONFIG,
      ETHEREUM_WIDGET_CONFIG,
    );
    await browserService.connectWallet();
  });

  test(`Coinbase connect`, async () => {
    await browserService.setup(COINBASE_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Taho connect`, async () => {
    await browserService.setup(TAHO_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Xdefi wallet connect`, async () => {
    await browserService.setup(XDEFI_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`OKX connect`, async () => {
    await browserService.setup(OKX_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Bitget connect`, async () => {
    await browserService.setup(BITGET_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Phantom connect`, async () => {
    await browserService.setup(PHANTOM_COMMON_CONFIG, ETHEREUM_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test.afterEach(async () => {
    await browserService.teardown();
  });
});
