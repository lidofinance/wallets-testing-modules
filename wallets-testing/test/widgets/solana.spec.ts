import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { prepareNodeModule } from '../../commons';
import { PHANTOM_COMMON_CONFIG } from '@lidofinance/wallets-testing-wallets';
import { SOLANA_WIDGET_CONFIG } from '@lidofinance/wallets-testing-widgets';
import { BrowserModule } from '../../browser/browser.module';
import { BrowserService } from '../../browser/browser.service';
import { test } from '@playwright/test';

test.describe('Solana widget testing', () => {
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

  test(`Phantom wallet connect`, async () => {
    await browserService.setup(PHANTOM_COMMON_CONFIG, SOLANA_WIDGET_CONFIG);
    await browserService.connectWallet();
  });

  test.afterEach(async () => {
    await browserService.teardown();
  });
});
