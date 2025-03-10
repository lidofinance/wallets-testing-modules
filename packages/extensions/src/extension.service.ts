import * as fs from 'fs/promises';
import * as path from 'path';
import { Injectable, ConsoleLogger } from '@nestjs/common';
import axios from 'axios';
import * as unzipper from 'unzipper';
import { once } from 'events';
import { ExtensionVersionChange, Manifest } from './extension.model';
import { ExtensionStorePage } from './extension.store.page';
import { BrowserContext, chromium } from '@playwright/test';
import { Readable } from 'node:stream';

@Injectable()
export class ExtensionService {
  staleExtensionDirs: string[] = [];
  extensionDirBasePath = path.join(__dirname, 'extension');
  idToExtension: Record<string, string> = {};
  private readonly logger = new ConsoleLogger(ExtensionService.name);
  private versions: Map<string, string> = new Map();

  async getExtensionDirFromId(
    id: string,
    latestStableDownloadUrl?: string,
  ): Promise<string> {
    await this.downloadExtension(id, latestStableDownloadUrl);

    return this.idToExtension[id];
  }

  async getManifestVersion(extensionDir: string): Promise<Manifest> {
    const content = await fs.readFile(extensionDir + '/manifest.json');
    return JSON.parse(String(content)).manifest_version;
  }
  async createExtensionDirById(id: string) {
    const extensionDirById = `${this.extensionDirBasePath}/${id}`;
    try {
      await fs.mkdir(extensionDirById);
      return extensionDirById;
    } catch (error) {
      this.logger.debug('Extension dir by id not created', error);
      return extensionDirById;
    }
  }
  async createBaseExtensionDir() {
    try {
      await fs.access(`${this.extensionDirBasePath}`, fs.constants.F_OK);
    } catch (error) {
      await fs.mkdir(`${this.extensionDirBasePath}`);
      this.logger.debug(error);
    }
  }

  async isExtensionByIdEmpty(id: string) {
    try {
      const files = await fs.readdir(`${this.extensionDirBasePath}/${id}`);
      return files.length < 0;
    } catch (error) {
      return true;
    }
  }

  async downloadExtension(id: string, downloadUrl?: string) {
    await this.createBaseExtensionDir();
    if (await this.isExtensionByIdEmpty(id)) {
      const extensionDir = await this.createExtensionDirById(id);
      downloadUrl
        ? await this.downloadFromUrl(id, downloadUrl, extensionDir)
        : await this.downloadFromStore(id, extensionDir);

      if (this.idToExtension[id] !== undefined) {
        this.staleExtensionDirs.push(this.idToExtension[id]);
      }
      this.idToExtension[id] = extensionDir;
    }
    this.idToExtension[id] = `${this.extensionDirBasePath}/${id}`;
  }

  // Download from url return zip -> unzip
  async downloadFromUrl(id: string, url: string, extensionDir: string) {
    this.logger.debug(`Download extension ${id} from ${url}`);
    await axios.get(url, { responseType: 'stream' }).then((response) => {
      const zip = unzipper.Extract({ path: extensionDir });
      response.data.pipe(zip);
      return once(zip, 'close');
    });
  }

  // Download from chrome store return crx -> zip -> unzip
  async downloadFromStore(id: string, extensionDir: string) {
    this.logger.debug(`Download extension ${id} from chrome store`);
    const browser = await chromium.launch();
    const chromeVersion = browser.version();
    await browser.close();
    const url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=${chromeVersion}&x=id%3D${id}%26installsource%3Dondemand%26uc&nacl_arch=x86-64&acceptformat=crx2,crx3`;
    await axios
      .get(url, { responseType: 'arraybuffer' })
      .then((response) => this.arrayBufferToStream(response.data))
      .then((response) => {
        const zip = unzipper.Extract({ path: extensionDir });
        response.pipe(zip);
        return once(zip, 'close');
      });
  }

  private arrayBufferToStream(arraybuffer: ArrayBuffer) {
    let buf = new Uint8Array(arraybuffer);
    let publicKeyLength, signatureLength, header, zipStartOffset;
    if (buf[4] === 2) {
      header = 16;
      publicKeyLength =
        0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + (buf[11] << 24);
      signatureLength =
        0 + buf[12] + (buf[13] << 8) + (buf[14] << 16) + (buf[15] << 24);
      zipStartOffset = header + publicKeyLength + signatureLength;
    } else {
      publicKeyLength =
        0 + buf[8] + (buf[9] << 8) + (buf[10] << 16) + ((buf[11] << 24) >>> 0);
      zipStartOffset = 12 + publicKeyLength;
    }
    // 16 = Magic number (4), CRX format version (4), lengths (2x4)
    buf = buf.slice(zipStartOffset);
    return Readable.from([buf]);
  }

  async cleanupDownloadedExtensions() {
    const extensions = this.staleExtensionDirs.length;
    if (extensions > 0) {
      for (const extensionDir of this.staleExtensionDirs) {
        await fs.rm(extensionDir, { force: true, recursive: true });
      }
      this.staleExtensionDirs = [];
      this.logger.debug(`Removed ${extensions} stale extension dirs`);
    }
  }

  async lookUpVersionChanges(
    context: BrowserContext,
    extensions: Map<string, string>,
  ): Promise<ExtensionVersionChange[]> {
    const changes: ExtensionVersionChange[] = [];
    const versions = new Map<string, string>();
    for (const [name, extensionId] of extensions) {
      const page = new ExtensionStorePage(context, extensionId);
      await page.navigate();
      const newVersion = await page.getVersion();
      versions.set(name, newVersion);
      const currentVersion = this.versions.get(name);
      if (
        currentVersion !== undefined &&
        newVersion !== this.versions.get(name)
      )
        changes.push({
          name: name,
          before: currentVersion,
          after: newVersion,
        });
      await page.close();
    }
    this.versions = versions;
    return changes;
  }
}
