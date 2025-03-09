import { Page } from '@playwright/test';
import { ConsoleLogger } from '@nestjs/common';

export interface WalletConnectPage {
  page: Page | undefined;
  logger: ConsoleLogger;

  navigate(): Promise<void>;

  connectWallet(wcUrl: string): Promise<void>;
}
