import { ExtensionService } from '@lidofinance/wallets-testing-extensions';
import * as fs from 'fs';
import { test, expect } from '@playwright/test';

test.describe('Extension service', () => {
  let extensionService: ExtensionService;

  test.beforeEach(async () => {
    extensionService = new ExtensionService();
  });

  test('should init', async () => {
    const extensionId = 'nkbihfbeogaeaoehlefnkodbefgpgknn';
    const extensionDir = await extensionService.getExtensionDirFromId(
      extensionId,
    );
    expect(extensionDir).toBeDefined();
    expect(fs.readdirSync(extensionDir).length).toBeGreaterThan(0);
    expect(
      await extensionService.getManifestVersion(extensionId),
    ).toBeGreaterThan(0);
  });
});
