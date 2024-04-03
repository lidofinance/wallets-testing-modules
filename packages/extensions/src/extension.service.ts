import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as unzipper from 'unzipper';
import { once } from 'events';
import { ExtensionVersionChange, Manifest } from './extension.model';
import { ExtensionStorePage } from './extension.store.page';
import { BrowserContext, chromium } from 'playwright';
import { Readable } from 'node:stream';

@Injectable()
export class ExtensionService {
  staleExtensionDirs: string[] = [];
  extensionDirBasePath = path.join(__dirname, 'extension');
  urlToExtension: Record<string, string> = {};
  idToExtension: Record<string, string> = {};
  private readonly logger = new Logger(ExtensionService.name);
  private versions: Map<string, string> = new Map();

  async getExtensionDirFromUrl(url: string): Promise<string> {
    await this.downloadFromUrl(url);
    return this.urlToExtension[url];
  }

  async getExtensionDirFromId(id: string): Promise<string> {
    await this.downloadFromStore(id);
    return this.idToExtension[id];
  }

  async getManifestVersion(extensionDir: string): Promise<Manifest> {
    const content = await fs.readFile(extensionDir + '/manifest.json');
    return JSON.parse(String(content)).manifest_version;
  }
  async createExtensionDir(id: string) {
    const extensionDirById = `${this.extensionDirBasePath}/${id}`;
    try {
      await fs.access(extensionDirById, fs.constants.F_OK);
      return (this.urlToExtension[id] = extensionDirById);
    } catch (error) {
      await fs.mkdir(extensionDirById);
      this.logger.debug(`Dir for the extension created`);
      return extensionDirById;
    }
  }
  async isExtensionDirEmpty(id: string) {
    try {
      const files = await fs.readdir(`${this.extensionDirBasePath}/${id}`);
      return files.length < 0;
    } catch (error) {
      this.logger.debug('Extension dir not exist/Unexpected error', error);
      return true;
    }
  }

  async downloadFromUrl(url: string) {
    this.logger.debug(`Download extension from ${url}`);
    const extensionDir = await fs.mkdtemp(os.tmpdir() + path.sep);
    await axios.get(url, { responseType: 'stream' }).then((response) => {
      const zip = unzipper.Extract({ path: extensionDir });
      response.data.pipe(zip);
      return once(zip, 'close');
    });
    if (this.urlToExtension[url] !== undefined) {
      this.staleExtensionDirs.push(this.urlToExtension[url]);
    }
    this.urlToExtension[url] = extensionDir;
  }

  async downloadFromStore(id: string) {
    if (await this.isExtensionDirEmpty(id)) {
      this.logger.debug(`Download extension ${id} from chrome store`);
      const extensionDir = await this.createExtensionDir(id);
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
      if (this.idToExtension[id] !== undefined) {
        this.staleExtensionDirs.push(this.idToExtension[id]);
      }
      this.idToExtension[id] = extensionDir;
    }
    //extension files exist - just return dir
    this.idToExtension[id] = `${this.extensionDirBasePath}/${id}`;
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
