import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  ExtensionService,
  ExtensionsModule,
} from '@lidofinance/wallets-testing-extensions';
import * as fs from 'fs';
import { test, expect } from '@playwright/test';

test.describe('Extension service', () => {
  let app: INestApplication;
  let extensionService: ExtensionService;

  test.beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ExtensionsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    extensionService = moduleFixture.get<ExtensionService>(ExtensionService);
    await app.init();
  });

  test('should init', async () => {
    const extensionDir = await extensionService.getExtensionDirFromId(
      'nkbihfbeogaeaoehlefnkodbefgpgknn',
    );
    expect(extensionDir).toBeDefined();
    expect(fs.readdirSync(extensionDir).length).toBeGreaterThan(0);
  });
});
