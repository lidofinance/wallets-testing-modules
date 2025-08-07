import { ConsoleLogger } from '@nestjs/common';
import { spawn } from 'child_process';
import net from 'net';
import axios from 'axios';
import {
  Request,
  APIRequestContext,
  APIResponse,
  BrowserContext,
  Page,
} from '@playwright/test';
import { providers, utils, BigNumber, Contract } from 'ethers';
import {
  EthereumNodeServiceOptions,
  ServiceUnreachableError,
  ERC20_SHORT_ABI,
  Account,
} from './node.constants';
import { execSync } from 'node:child_process';

export class EthereumNodeService {
  private readonly logger = new ConsoleLogger(EthereumNodeService.name);
  private readonly privateKeys: string[] = [];
  private readonly port: number;
  private readonly host = '127.0.0.1';

  state?: {
    nodeProcess: ReturnType<typeof spawn>;
    nodeUrl: string;
    accounts: Account[];
  };

  constructor(private options: EthereumNodeServiceOptions) {
    this.port = options.port || 8545;
  }

  private startAnvil(rpcUrl: string, options?: string[]) {
    const args = [
      `--fork-url=${rpcUrl}`,
      `--balance=${this.options.defaultBalance.toString()}`,
      '--block-time=2',
      '--accounts=30',
      "--derivation-path=m/44'/60'/2020'/0/0",
      `--port=${this.port}`,
      `--host=${this.host}`,
      ...(options ?? []),
    ];
    if (this.options.chainId) args.push(`--chain-id=${this.options.chainId}`);
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

  async startNode(options?: string[]) {
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
    const process = this.startAnvil(rpcUrl, options);
    const nodeUrl = `http://${this.host}:${this.port}`;

    const isAnvilReady = await this.waitForAnvilReady(nodeUrl);

    if (!isAnvilReady) {
      process.kill('SIGKILL');
      throw new Error('Anvil did not start');
    }

    const provider = new providers.JsonRpcProvider(nodeUrl);
    const addresses = await provider.listAccounts();
    const accounts: Account[] = addresses.map((address, index) => ({
      address,
      secretKey: this.privateKeys?.[index] || '',
    }));

    this.state = { nodeProcess: process, nodeUrl, accounts };
  }

  getAccount(index = 0): Account {
    return this.state?.accounts[index];
  }

  async getBalance(account: Account): Promise<string | undefined> {
    if (!this.state) return undefined;
    const provider = new providers.JsonRpcProvider(this.state.nodeUrl);
    const balance = await provider.getBalance(account.address);
    return utils.formatEther(balance);
  }

  async setErc20Balance(
    account: Account,
    tokenAddress: string,
    mappingSlot: number,
    balance: number,
  ): Promise<BigNumber> {
    if (!this.state) throw new Error('Node not ready');

    const provider = new providers.JsonRpcProvider(this.state.nodeUrl);
    const contract = new Contract(tokenAddress, ERC20_SHORT_ABI, provider);
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

    await provider.send('anvil_setStorageAt', [
      tokenAddress,
      slot,
      utils.hexZeroPad(value.toHexString(), 32),
    ]);
    const balanceAfter = await contract.balanceOf(account.address);
    return balanceAfter.div(decimals);
  }

  private async waitForAnvilReady(
    rpcUrl: string,
    {
      timeoutMs = 30000,
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
