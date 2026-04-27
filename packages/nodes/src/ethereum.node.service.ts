import { ConsoleLogger } from '@nestjs/common';
import { spawn } from 'child_process';
import net from 'net';
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
import {
  ANVIL_DEFAULT_DERIVATION_PATH,
  ANVIL_DEFAULT_PORT,
  ANVIL_FATAL_PATTERNS,
  ANVIL_IMPERSONATE_ETH_BALANCE,
  ANVIL_LOG_DIR,
  ANVIL_RESTART_PATTERNS,
} from './anvil.constants';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs, { WriteStream } from 'node:fs';

const logger = new ConsoleLogger('EthereumNodeService');

export class EthereumNodeService {
  private provider: any;
  private logStream?: WriteStream;
  private lastAnvilStderr: string[] = [];
  private readonly privateKeys: string[] = [];
  private readonly host = '127.0.0.1';
  public readonly localForkConfigPath = 'local_fork_config.json';

  private get port(): number {
    return this.options.port ?? ANVIL_DEFAULT_PORT;
  }
  private get defaultBalance(): number {
    return this.options.defaultBalance ?? 100;
  }
  private get accountsLength(): number {
    return this.options.accountsLength ?? 30;
  }
  private get blockTime(): number {
    return this.options.blockTime ?? 2;
  }
  private get derivationPath(): string {
    return this.options.derivationPath ?? ANVIL_DEFAULT_DERIVATION_PATH;
  }
  private get runOptions(): string[] {
    return this.options.runOptions ?? [];
  }

  state?: {
    nodeProcess: ReturnType<typeof spawn | typeof undefined>;
    nodeUrl: string;
    accounts: Account[];
  };

  constructor(private options: EthereumNodeServiceOptions) {}

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
      ...this.runOptions,
    ];

    const anvilProcess = spawn('anvil', args, { stdio: 'pipe' });

    if (this.options.forkLog?.enabled && this.options.forkLog?.logToFile) {
      fs.mkdirSync(ANVIL_LOG_DIR, { recursive: true });

      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `anvil-log-${stamp}.log`;
      const filePath = path.join(ANVIL_LOG_DIR, fileName);
      this.logStream = fs.createWriteStream(filePath, { flags: 'w' });
    }

    // DONT REMOVE THIS: prevents process from hanging on some platforms
    anvilProcess.stdout.on('data', (data) => {
      if (!this.options.forkLog?.enabled) return;
      if (this.options.forkLog?.logToConsole) {
        logger.debug(`[Anvil logs] ${data}`);
      }
      if (this.logStream) {
        this.logStream.write(
          `[${new Date().toISOString()}] ${data.toString()}`,
        );
      }
    });

    this.lastAnvilStderr = [];
    anvilProcess.stderr.on('data', (data) => {
      const line = data.toString();
      this.lastAnvilStderr.push(line);
      if (this.lastAnvilStderr.length > 20) this.lastAnvilStderr.shift();
      logger.debug(`[Anvil STDERR] ${line}`);
      if (this.logStream)
        this.logStream.write(`[${new Date().toISOString()}] ${line}`);
    });

    anvilProcess.on('close', (code) => {
      if (code === 0) logger.log(`[Anvil] Process exited cleanly`);
      else logger.warn(`[Anvil] Process exited with code ${code}`);

      if (this.logStream)
        this.logStream.write(
          `[${new Date().toISOString()}] Anvil Closed with code ${code}`,
        );
    });

    return anvilProcess;
  }

  async startNode() {
    if (this.state) return;
    const nodeUrl = `http://${this.host}:${this.port}`;
    let process;

    if (!this.options.useExternalFork) {
      logger.log('Using local Anvil node...');
      const rpcUrl = this.options.rpcUrl;
      if (!rpcUrl) throw new Error('RPC URL is required');

      logger.log('Starting Anvil node...');
      process = this.startAnvil();

      await this.waitForAnvilReady(nodeUrl, process, {
        restartFn: () => {
          process = this.startAnvil();
          return process;
        },
      });
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
        try {
          await this.setErc20Balance(
            this.getAccount(),
            token.address,
            token.mappingSlot,
            this.defaultBalance,
          );
        } catch (e) {
          logger.error(
            `Failed to set balance for token ${token.name} (${
              token.address
            }): ${e instanceof Error ? e.message : e}`,
          );
          throw e;
        }
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
      ANVIL_IMPERSONATE_ETH_BALANCE,
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
    anvilProcess?: ReturnType<typeof spawn>,
    {
      timeoutMs = 60000,
      delayMs = 500,
      logIntervalMs = 5000,
      restartFn,
    }: {
      timeoutMs?: number;
      delayMs?: number;
      logIntervalMs?: number;
      restartFn?: () => ReturnType<typeof spawn>;
    } = {},
  ): Promise<boolean> {
    const start = Date.now();
    let lastLogAt = 0;

    // Wait until node responds to eth_blockNumber
    while (Date.now() - start < timeoutMs) {
      if (anvilProcess?.exitCode !== null) {
        const diagnosis = this.diagnoseStderr();
        if (diagnosis?.type === 'fatal') {
          throw new Error(
            `Anvil fatal error: ${
              diagnosis.reason
            }\n${this.lastAnvilStderr.join('')}`,
          );
        }
        if (restartFn) {
          logger.warn(
            `Anvil process exited with code ${anvilProcess.exitCode}${
              diagnosis ? `: ${diagnosis.reason}` : ''
            }. Restarting...`,
          );
          anvilProcess = restartFn();
          await this.sleep(delayMs);
          continue;
        }
        throw new Error(
          `Anvil process exited unexpectedly with code ${anvilProcess.exitCode}`,
        );
      }

      const { port } = new URL(rpcUrl);
      const portOpen = !(await this.ensurePortAvailable(Number(port)));

      const now = Date.now();
      if (now - lastLogAt >= logIntervalMs) {
        logger.debug(
          portOpen
            ? `Port is open, sending eth_blockNumber...`
            : `Waiting for Anvil to bind port ${port}...`,
        );
        lastLogAt = now;

        if (!portOpen && restartFn) {
          const diagnosis = this.diagnoseStderr();
          if (diagnosis?.type === 'restart') {
            logger.warn(`Anvil is stuck: ${diagnosis.reason}. Restarting...`);
            anvilProcess.kill('SIGKILL');
            anvilProcess = restartFn();
          }
        }
      }

      if (!portOpen) {
        await this.sleep(delayMs);
        continue;
      }
      try {
        const res = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
          signal: AbortSignal.timeout(5000),
        });

        const resBody = await res.json();
        const isHealthy = !resBody.error && !!resBody.result;

        if (isHealthy) return isHealthy;
      } catch (error: any) {
        logger.debug(`RPC not ready: ${error?.message || 'Unknown error'}`);
      }

      await this.sleep(delayMs);
    }

    throw new Error(`Fork did not become ready within ${timeoutMs} ms`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private diagnoseStderr(): {
    type: 'fatal' | 'restart';
    reason: string;
  } | null {
    const stderr = this.lastAnvilStderr.join('');
    const fatal = ANVIL_FATAL_PATTERNS.find(({ pattern }) =>
      pattern.test(stderr),
    );
    if (fatal) return { type: 'fatal', reason: fatal.reason };
    const restart = ANVIL_RESTART_PATTERNS.find(({ pattern }) =>
      pattern.test(stderr),
    );
    if (restart) return { type: 'restart', reason: restart.reason };
    return null;
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

  async mockRoute(contextOrPage: BrowserContext | Page): Promise<void> {
    if (!this.options.mockConfig.mockEnabled) return;
    const rpcUrl = this.state?.nodeUrl || this.options.rpcUrl;
    logger.debug(
      `[mockRoute] RPC mocker enabled and uses the ${
        this.state ? 'FORK' : 'ENV'
      } rpc url. (to mock: /${this.options.mockConfig.rpcUrlToMock}/)`,
    );

    await contextOrPage.route(
      new RegExp(this.options.mockConfig.rpcUrlToMock.join('|')),
      async (route) => {
        const postDataRaw = route.request().postData();
        if (!postDataRaw) return route.continue();

        let parsed: unknown;
        try {
          parsed = JSON.parse(postDataRaw);
        } catch (err) {
          logger.error(`[mockRoute] JSON parse error`, err);
          return route.continue();
        }

        const singleResponse = await this.proxyRpcRequest(
          contextOrPage.request,
          rpcUrl,
          parsed,
        );
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(singleResponse),
        });
      },
    );
  }

  private async proxyRpcRequest(
    request: APIRequestContext,
    rpcUrl: string,
    payload: any,
  ): Promise<unknown> {
    const res = await this.fetchSafety(request, rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(payload),
    });

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
  }

  async fetchSafety(
    request: APIRequestContext,
    urlOrRequest: string | Request,
    options: any,
  ): Promise<APIResponse | undefined> {
    let lastErr: { message: string } | undefined;

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

      if (this.logStream) {
        const stream = this.logStream;
        this.logStream = undefined;
        await new Promise<void>((resolve) => stream.end(resolve));
      }

      this.state = undefined;
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.stopNode();
  }

  static async forceStopNode(port: number): Promise<void> {
    logger.warn(`Port ${port} used. Killing process...`);
    const pids = execFileSync('lsof', ['-ti', String(port)])
      .toString()
      .trim()
      .split('\n')
      .map(Number)
      .filter(Boolean);

    if (!pids.length) return;

    for (const pid of pids) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (e) {
        throw new Error(`Failed to kill process ${pid} on port ${port}: ${e}`);
      }
    }
    logger.log(`Successfully killed process on port ${port}`);
  }

  private async waitUntilPortIsFree(
    port: number,
    timeoutMs = 20000,
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const available = await this.ensurePortAvailable(port);
      if (available) return;
      await this.sleep(100);
    }
    throw new Error(
      `Port ${port} did not become available within ${timeoutMs}ms`,
    );
  }
}
