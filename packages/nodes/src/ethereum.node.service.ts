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
  test,
} from '@playwright/test';
import { BigNumber, Contract, providers, utils } from 'ethers';
import {
  Account,
  ERC20_SHORT_ABI,
  EthereumNodeServiceOptions,
  ServiceUnreachableError,
} from './node.constants';
import { execSync } from 'node:child_process';

export class EthereumNodeService {
  private readonly logger = new ConsoleLogger(EthereumNodeService.name);
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

  state?: {
    nodeProcess: ReturnType<typeof spawn>;
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
  }

  private startAnvil() {
    const args = [
      `--host=${this.host}`,
      `--fork-url=${this.options.rpcUrl}`,
      `--port=${this.port}`,
      `--balance=${this.defaultBalance}`,
      `--accounts=${this.accountsLength}`,
      `--derivation-path=${this.derivationPath}`,
      ...(this.runOptions ?? []),
    ];

    const anvilProcess = spawn('anvil', args, { stdio: 'pipe' });

    anvilProcess.stdout.once('data', (data: Buffer) => {
      const text = data.toString();

      const keyMatches = [...text.matchAll(/\(\d+\)\s+(0x[a-fA-F0-9]{64})/g)];
      keyMatches.forEach((match) => this.privateKeys.push(match[1]));
    });

    anvilProcess.stderr.on('data', (data) => {
      this.logger.error(`[Anvil STDERR] ${data}`);
    });

    anvilProcess.on('close', (code) => {
      this.logger.warn(`[Anvil Closed] Code ${code}`);
    });

    return anvilProcess;
  }

  async startNode() {
    if (this.state) return;

    const rpcUrl = this.options.rpcUrl;
    if (!rpcUrl) throw new Error('RPC URL is required');

    // Ensure port is free in case it wasn't released properly
    if (!(await this.ensurePortAvailable(this.port))) {
      this.logger.warn(
        `Port ${this.port} already in use. Cleaning up before restart...`,
      );
      try {
        execSync(`kill -9 $(lsof -ti:${this.port})`, {
          stdio: 'ignore',
          shell: '/bin/bash',
        });
      } catch (e) {
        throw new Error(
          `Failed to kill process on port ${this.port}: ${e.toString()}`,
        );
      }
    }

    this.logger.debug('Starting Anvil node...');
    const process = this.startAnvil();
    const nodeUrl = `http://${this.host}:${this.port}`;

    const isAnvilReady = await this.waitForAnvilReady(nodeUrl);

    if (!isAnvilReady) {
      process.kill('SIGKILL');
      throw new Error('Anvil did not start');
    }

    this.provider = new providers.JsonRpcProvider(nodeUrl);
    const addresses = await this.provider.listAccounts();
    const accounts: Account[] = addresses.map((address, index) => ({
      address,
      secretKey: this.privateKeys?.[index] || '',
    }));

    this.state = { nodeProcess: process, nodeUrl, accounts };
  }

  async setupDefaultTokenBalances() {
    if (this.options.tokens) {
      for (const token of this.options.tokens) {
        await test.step(`Setup balance ${this.defaultBalance} ${token.name}`, async () => {
          await this.setErc20Balance(
            this.getAccount(),
            token.address,
            token.mappingSlot,
            this.defaultBalance,
          );
        });
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
      this.logger.debug(`Trying to send eth_blockNumber...`);
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
        this.logger.warn(`RPC error: ${error?.message || 'Unknown error'}`);
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
    this.logger.debug(`[mockRoute] Registered for URL: ${url}`);

    await contextOrPage.route(url, async (route) => {
      if (!this.state) {
        this.logger.warn(`[mockRoute] No active node state`);
        return route.continue();
      }
      const postDataRaw = route.request().postData();

      if (!postDataRaw) return route.continue();

      let parsed;
      try {
        parsed = JSON.parse(postDataRaw);
      } catch (err) {
        this.logger.error(`[mockRoute] JSON parse error`, err);
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

      if (Array.isArray(parsed)) {
        const responses = await Promise.all(parsed.map(proxyRequest));
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(responses),
        });
      }

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
        this.logger.warn(
          `[fetchSafety] Attempt ${tryCount + 1} failed: ${lastErr.message}`,
        );
      }
    }

    this.logger.error(`[fetchSafety] Failed after 3 attempts`, lastErr);

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
    if (this.state) {
      this.logger.log('Stopping Node...');
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
        this.logger.warn(
          `Timeout while waiting for port ${this.port} to be released`,
        );
      }

      this.state = undefined;
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
