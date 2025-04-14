# Browser service

This package provides the BrowserService class for initializing and managing a Playwright browser context, network configurations, and wallets (EOA or WalletConnect). It facilitates automated testing of interactions with Web3 wallets (e.g., Metamask) and offers convenient methods for network switching, connecting to a fork node, etc.

# Installation
```
npm install browser-service
# or
yarn add browser-service
```

# Quick Start

```typescript
import { test, expect } from '@playwright/test';
import { BrowserService } from 'browser-service';

test.describe('Example usage of BrowserService', () => {
  let browserService: BrowserService;

  test.beforeAll(async () => {
    browserService = new BrowserService({
      networkConfig: {
        chainName: 'Holesky',
        chainId: 17000,
        rpcUrl: 'https://holesky.infura.io/v3/<YOUR_INFURA_KEY>',
      },
      walletConfig: {
        COMMON: {
          WALLET_NAME: 'METAMASK',
          EXTENSION_WALLET_NAME: 'METAMASK',
          WALLET_TYPE: 'EOA', // or 'WC' for WalletConnect
          STORE_EXTENSION_ID: 'metamask', 
          LATEST_STABLE_DOWNLOAD_LINK: 'https://example.com/metamask.crx',
        },
        SECRET_PHRASE: 'test test test test test test test test test test test junk',
        NETWORK_NAME: 'Holesky',
      },
      nodeConfig: {
        rpcUrlToMock: '**/api/rpc?chainId=17000',
      },
      enableBrowserContext: true,
    });

    // Initialize the wallet (without fork)
    await browserService.initWalletSetup();
  });

  test('Example test', async () => {
    const browserContext = await browserService.getBrowserContext();
    const page = await browserService.getBrowserContextPage();

    // Perform browser actions, testing wallet interaction with an application
    await page.goto('https://example.org');
    expect(await page.title()).toBe('Example Domain');
  });

  test.afterAll(async () => {
    // Clean up after tests
    await browserService.teardown();
  });
});
```

# Options

- `networkConfig` – describes the network (chainId, rpcUrl, chainName).
- `walletConfig` – wallet settings (wallet type, extension info, etc.).
- `nodeConfig` – configuration for mocking RPC requests (e.g., URL pattern).
- `browserOptions` – options for launching the browser (headless, executable paths, etc.).
- `enableBrowserContext` – enables or disables the use of a custom data dir for the browser context.

# Methods
- `initWalletSetup(useFork?: boolean)` - Launches the main wallet initialization procedure by setting up the chosen network.
	If `useFork = true`, the wallet will work through a local fork node (started automatically).
- `setupWithNode()` - Explicitly starts the fork node, creates a test account, and configures the wallet to use the local network.
- `setup(commonWalletConfig?: CommonWalletConfig)` - Creates the extension service, sets up the browser context, downloads and initializes the wallet in Playwright.
- `teardown()` - Closes the browser context and stops the local node (if it was started).
