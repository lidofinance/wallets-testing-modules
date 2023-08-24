# Extensions Module

Download extensions from chrome store

## Install

```bash
yarn add @lidofinance/wallets-testing-extensions
```

## Usage

```ts
import {ExtensionService, ExtensionsModule} from "@lidofinance/wallets-testing-extensions";

@Module({
    imports: [ExtensionsModule],
})
export class MyModule {
}

// Usage
export class MyService {
    constructor(private extensionService: ExtensionService) {
    }

    async myMethod() {
        const extensionDir = await extensionService.getExtensionDirFromId(
            'nkbihfbeogaeaoehlefnkodbefgpgknn',
        );
        expect(extensionDir).toBeDefined();
    }
}
```
