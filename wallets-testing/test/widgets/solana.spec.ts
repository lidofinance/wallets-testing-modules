import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { prepareNodeModule } from '../../commons';
import {
  PHANTOM_COMMON_CONFIG,
  COINBASE_COMMON_CONFIG,
  COIN98_COMMON_CONFIG,
  EXODUS_COMMON_CONFIG,
} from '@lidofinance/wallets-testing-wallets';
import { SOLANA_WIDGET_CONFIG } from '@lidofinance/wallets-testing-widgets';
import { BrowserModule } from '../../browser/browser.module';
import { BrowserService } from '../../browser/browser.service';
import { test } from '@playwright/test';

test.describe('Solana', () => {
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

  test(`Phantom connect`, async () => {
    await browserService.setup(PHANTOM_COMMON_CONFIG, SOLANA_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Coinbase connect`, async () => {
    await browserService.setup(COINBASE_COMMON_CONFIG, SOLANA_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test(`Coin98 connect`, async () => {
    await browserService.setup(COIN98_COMMON_CONFIG, SOLANA_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test.only(`Exodus connect`, async () => {
    await browserService.setup(EXODUS_COMMON_CONFIG, SOLANA_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test.afterEach(async () => {
    await browserService.teardown();
  });
});
