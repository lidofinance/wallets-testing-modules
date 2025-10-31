import type { PlaywrightTestConfig } from '@playwright/test';
import { ReporterOptions, ReportersSettings } from './services';
import { IS_SAFE_TESTING } from './config';

const wtmReporter: ReporterOptions = {
  app: {
    name: `[ETH Widget] ${
      IS_SAFE_TESTING ? 'Safe Iframe testing' : 'Wallets testing'
    }`, // DONT CHANGE THIS NAME, PLS!
    emojiPrefix: IS_SAFE_TESTING ? '🤖' : '📘',
  },
};

const config: PlaywrightTestConfig = {
  name: 'Widget',
  testDir: './test',
  timeout: 240 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: new ReportersSettings(wtmReporter).getReporters(),
  use: {
    actionTimeout: 120000,
    screenshot: { fullPage: true, mode: 'only-on-failure' },
    trace: 'on-first-retry',
  },
};

export default config;
