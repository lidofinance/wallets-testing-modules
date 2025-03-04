import { Page } from '@playwright/test';
import { Logger } from '@nestjs/common';

export interface WalletConnectPage {
  page: Page | undefined;
  logger: Logger;

  navigate(): Promise<void>;

  connectWallet(wcUrl: string): Promise<void>;
}
