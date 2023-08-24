# Wallets Module

Module with playwright page objects for wallet extensions

## Install

```bash
yarn add @lidofinance/wallets-testing-wallets
```

## Usage

```ts
import {BrowserContext} from "playwright";
import {MetamaskPage} from "./metamask.page";

export class MyService {
    constructor() {
    }

    async goToMetamask(browserContext: BrowserContext) {
        const metamask = new MetamaskPage(browserContext, "chrome-extension://{extensionId}", {})
    }
}
```
