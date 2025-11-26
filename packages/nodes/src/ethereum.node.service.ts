import { ConsoleLogger } from '@nestjs/common';
import { spawn } from 'child_process';
import net from 'net';
import axios from 'axios';
import {
  APIRequestContext,
  APIResponse,
  BrowserContext,
  Page,
  Request,
} from '@playwright/test';
import { BigNumber, Contract, providers, utils } from 'ethers';
import {
  Account,
  ERC20_SHORT_ABI,
  EthereumNodeServiceOptions,
  ServiceUnreachableError,
} from './node.constants';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const logger = new ConsoleLogger('EthereumNodeService');

export class EthereumNodeService {
  private provider: any;
  private readonly privateKeys: string[] = [];
  private readonly host = '127.0.0.1';

  // anvil run params
  private readonly port: number;
  private readonly defaultBalance: number;
  private readonly accountsLength: number;
  private readonly derivationPath: string;
  private readonly blockTime: number;
  private readonly runOptions: string[];
  public readonly localForkConfigPath: string;

  state?: {
    nodeProcess: ReturnType<typeof spawn | typeof undefined>;
    nodeUrl: string;
    accounts: Account[];
  };

  constructor(private options: EthereumNodeServiceOptions) {
    this.port = options.port || 8545;
    this.defaultBalance = options.defaultBalance || 100;
    this.accountsLength = options.accountsLength || 30;
    this.blockTime = options.blockTime || 2;
    this.derivationPath = options.derivationPath || "m/44'/60'/2020'/0/0";
    this.runOptions = options.runOptions;
    this.localForkConfigPath = 'local_fork_config.json';
  }

  // extended usage only
  public getProvider(): providers.JsonRpcProvider {
    return this.provider;
  }

  loadDataFromConfig() {
    try {
      const configPath = path.resolve(process.cwd(), this.localForkConfigPath);
      if (!fs.existsSync(configPath)) {
        throw new Error(
          `${this.localForkConfigPath} not found at ${configPath}`,
        );
      }
      const raw = fs.readFileSync(configPath, 'utf8');
      const json = JSON.parse(raw);
      if (Array.isArray(json?.private_keys)) {
        this.privateKeys.push(...json.private_keys);
      } else {
        logger.warn(`private_keys not found in ${this.localForkConfigPath}`);
      }
      return this.privateKeys;
    } catch (e) {
      throw new Error(
        // @ts-expect-error e message
        `Failed to read ${this.localForkConfigPath}: ${e.message}`,
      );
    }
  }

  private startAnvil() {
    const args = [
      `--host=${this.host}`,
      `--fork-url=${this.options.rpcUrl}`,
      `--port=${this.port}`,
      `--balance=${this.defaultBalance}`,
      `--block-time=${this.blockTime}`,
      `--accounts=${this.accountsLength}`,
      `--derivation-path=${this.derivationPath}`,
      `--config-out=${this.localForkConfigPath}`,
      ...(this.runOptions ?? []),
    ];

    const anvilProcess = spawn('anvil', args, { stdio: 'pipe' });

    // DONT REMOVE THIS: prevents process from hanging on some platforms
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    anvilProcess.stdout.on('data', () => {});

    anvilProcess.stderr.on('data', (data) => {
      logger.error(`[Anvil STDERR] ${data}`);
    });

    anvilProcess.on('close', (code) => {
      logger.warn(`[Anvil Closed] Code ${code}`);
    });

    return anvilProcess;
  }

  async startNode() {
    if (this.state) return;
    const nodeUrl = `http://${this.host}:${this.port}`;
    let process;

    if (!this.options.useExternalFork) {
      logger.debug('Using local Anvil node...');
      const rpcUrl = this.options.rpcUrl;
      if (!rpcUrl) throw new Error('RPC URL is required');

      // Ensure port is free in case it wasn't released properly
      if (!(await this.ensurePortAvailable(this.port))) {
        logger.warn(
          `Port ${this.port} already in use. Cleaning up before restart...`,
        );
        await EthereumNodeService.forceStopNode(this.port);
      }

      logger.debug('Starting Anvil node...');
      process = this.startAnvil();

      const isAnvilReady = await this.waitForAnvilReady(nodeUrl);

      if (!isAnvilReady) {
        process.kill('SIGKILL');
        throw new Error('Anvil did not start');
      }
    }
    logger.log(`Ethereum node is running at ${nodeUrl}`);

    // Load private keys after node is ready
    this.loadDataFromConfig();

    this.provider = new providers.JsonRpcProvider(nodeUrl);
    const addresses = await this.provider.listAccounts();
    const accounts: Account[] = addresses.map((address, index) => ({
      address,
      secretKey: this.privateKeys?.[index] || '',
    }));

    if (this.options.warmUpCallback) {
      logger.debug('Running warm-up callback...');
      await this.options.warmUpCallback();
      logger.debug('Warm-up callback completed.');
    }

    this.state = { nodeProcess: process, nodeUrl, accounts };
  }

  async setupDefaultTokenBalances() {
    if (this.options.tokens) {
      for (const token of this.options.tokens) {
        logger.log(`Setup balance ${this.defaultBalance} ${token.name}`);
        await this.setErc20Balance(
          this.getAccount(),
          token.address,
          token.mappingSlot,
          this.defaultBalance,
        );
      }
    }
  }

  getAccount(index = 0): Account {
    return this.state?.accounts[index];
  }

  async getBalance(account: Account): Promise<string | undefined> {
    if (!this.state) return undefined;
    const balance = await this.provider.getBalance(account.address);
    return utils.formatEther(balance);
  }

  // set erc20 balance with mappingSlot
  async setErc20Balance(
    account: Account,
    tokenAddress: string,
    mappingSlot: any,
    balance: number, // ether value
  ): Promise<BigNumber> {
    if (!this.state) throw new Error('Node not ready');
    const contract = new Contract(tokenAddress, ERC20_SHORT_ABI, this.provider);
    const decimals = BigNumber.from(10).pow(await contract.decimals());
    const mappingSlotHex = BigNumber.from(mappingSlot).toHexString();

    const slot = utils.solidityKeccak256(
      ['bytes32', 'bytes32'],
      [
        utils.hexZeroPad(account.address, 32),
        utils.hexZeroPad(mappingSlotHex, 32),
      ],
    );

    const value = BigNumber.from(balance).mul(decimals);

    await this.provider.send('anvil_setStorageAt', [
      tokenAddress,
      slot,
      utils.hexZeroPad(value.toHexString(), 32),
    ]);

    const balanceAfter = await contract.balanceOf(account.address);
    return balanceAfter.div(decimals);
  }

  // set erc20 balance with no mappingSlot
  async setErc20BalanceImpersonate(
    tokenAbi: any[],
    tokenAddress: string,
    account: Account,
    amount: number, // ether value
  ): Promise<string> {
    const erc20Token = new Contract(tokenAddress, tokenAbi, this.provider);

    // decimals & amount -> wei
    const decimals: number = await erc20Token.decimals();
    const amountWei = utils.parseUnits(amount.toString(), decimals);

    const controllerAddress: string = await erc20Token.controller();

    // impersonate + gas
    await this.provider.send('anvil_impersonateAccount', [controllerAddress]);
    await this.provider.send('anvil_setBalance', [
      controllerAddress,
      '0x3635C9ADC5DEA00000', // ~1000 ETH
    ]);

    const ctrlSigner = this.provider.getSigner(controllerAddress);
    const tokenAsCtrl = erc20Token.connect(ctrlSigner);

    // enable transfers if possible & disabled
    try {
      const enabled: boolean = await tokenAsCtrl.transfersEnabled();
      if (!enabled) {
        const tx = await tokenAsCtrl.enableTransfers(true);
        await tx.wait();
      }
    } catch {
      // if no transfersEnabled/enableTransfers - just skip
    }

    // mint impersonated erc20 token
    const tx = await tokenAsCtrl.generateTokens(account.address, amountWei);
    await tx.wait();

    const balanceAfter = await erc20Token.balanceOf(account.address);
    return balanceAfter.div(decimals);
  }

  private async waitForAnvilReady(
    rpcUrl: string,
    {
      timeoutMs = 300000,
      delayMs = 500,
    }: { timeoutMs?: number; delayMs?: number } = {},
  ): Promise<boolean> {
    const start = Date.now();

    // Wait until node responds to eth_blockNumber
    while (Date.now() - start < timeoutMs) {
      logger.debug(`Trying to send eth_blockNumber...`);
      try {
        const res = await axios.post(
          rpcUrl,
          {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );

        const resBody = res.data;
        const isHealthy = !resBody.error && !!resBody.result;

        if (isHealthy) return isHealthy;
      } catch (error: any) {
        logger.warn(`RPC error: ${error?.message || 'Unknown error'}`);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(`Fork did not become ready within ${timeoutMs} ms`);
  }

  private ensurePortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.once('error', () => resolve(true));
      socket.once('connect', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, this.host);
    });
  }

  async mockRoute(
    url: string,
    contextOrPage: BrowserContext | Page,
  ): Promise<void> {
    logger.debug(`[mockRoute] Registered for URL: ${url}`);

    await contextOrPage.route(url, async (route) => {
      if (!this.state) {
        logger.warn(`[mockRoute] No active node state`);
        return route.continue();
      }
      const postDataRaw = route.request().postData();

      if (!postDataRaw) return route.continue();

      let parsed;
      try {
        parsed = JSON.parse(postDataRaw);
      } catch (err) {
        logger.error(`[mockRoute] JSON parse error`, err);
        return route.continue();
      }

      const proxyRequest = async (payload: any) => {
        const res = await this.fetchSafety(
          contextOrPage.request,
          this.state.nodeUrl,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify(payload),
          },
        );

        if (!res) {
          return {
            jsonrpc: '2.0',
            id: payload.id ?? null,
            error: { code: -32000, message: 'Mock route fetch failed' },
          };
        }

        try {
          return JSON.parse(await res.text());
        } catch {
          return {
            jsonrpc: '2.0',
            id: payload.id ?? null,
            error: { code: -32700, message: 'Invalid JSON in response' },
          };
        }
      };

      const singleResponse = await proxyRequest(parsed);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(singleResponse),
      });
    });
  }

  async fetchSafety(
    request: APIRequestContext,
    urlOrRequest: string | Request,
    options: any,
  ): Promise<APIResponse | undefined> {
    let lastErr;

    options.timeout = 0;
    options.headers = {
      'Content-Type': 'application/json',
      Connection: 'Keep-Alive',
      'Keep-Alive': 'timeout=1',
      ...options.headers,
    };

    for (let tryCount = 0; tryCount < 3; tryCount++) {
      try {
        return await request.fetch(urlOrRequest, options);
      } catch (err) {
        lastErr = err as { message: string };
      }
    }

    logger.error(`[fetchSafety] Failed after 3 attempts`, lastErr);

    if (
      lastErr &&
      !String(lastErr.message).includes(
        'Target page, context or browser has been closed',
      )
    ) {
      throw new ServiceUnreachableError(lastErr, options);
    }

    return undefined;
  }

  async stopNode(): Promise<void> {
    if (this.options.useExternalFork) {
      logger.log('Using external fork. Skipping node stop.');
      return;
    }
    if (this.state) {
      logger.log('Stopping Node...');
      const nodeProcess = this.state.nodeProcess;

      const processExited = new Promise<void>((resolve, reject) => {
        nodeProcess.once('exit', resolve);
        nodeProcess.once('close', resolve);
        nodeProcess.once('error', reject);
      });

      nodeProcess.kill('SIGTERM');

      const timeout = new Promise<void>((resolve) =>
        setTimeout(() => {
          nodeProcess.kill('SIGKILL');
          resolve();
        }, 5000),
      );

      await Promise.race([processExited, timeout]);

      // Ensure the port is free
      try {
        await this.waitUntilPortIsFree(this.port);
      } catch (err) {
        logger.warn(
          `Timeout while waiting for port ${this.port} to be released`,
        );
      }

      this.state = undefined;
    }
  }

  static async forceStopNode(port: number): Promise<void> {
    try {
      logger.warn(`Port ${port} used. Killing process...`);
      execSync(`kill -9 $(lsof -ti:${port})`, {
        stdio: 'ignore',
        shell: '/bin/bash',
      });
      logger.log(`Successfully killed process on port ${port}`);
    } catch (e) {
      throw new Error(
        `Failed to kill process on port ${port}: ${e.toString()}`,
      );
    }
  }

  private async waitUntilPortIsFree(
    port: number,
    timeoutMs = 20000,
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const available = await this.ensurePortAvailable(port);
      if (available) return;
      await new Promise((res) => setTimeout(res, 100));
    }
    throw new Error(
      `Port ${port} did not become available within ${timeoutMs}ms`,
    );
  }
}
