import type { PlaywrightTestConfig } from '@playwright/test';
import { ReporterOptions, ReportersSettings } from './services';

const wtmReporter: ReporterOptions = {
  app: {
    name: '[ETH Widget] Wallets testing', // DONT CHANGE THIS NAME, PLS!
    emojiPrefix: '📘',
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
