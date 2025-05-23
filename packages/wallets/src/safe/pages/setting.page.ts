import { Locator, Page } from '@playwright/test';

export class SettingPage {
  rpcUrlInput: Locator;
  saveSettingBtn: Locator;

  constructor(public page: Page) {
    this.rpcUrlInput = this.page.locator('input[name="rpc"]');
    this.saveSettingBtn = this.page.locator('button:has-text("Save")');
  }
}
