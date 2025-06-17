import { Inject, Injectable, ConsoleLogger } from '@nestjs/common';
import { spawn } from 'child_process';
import net from 'net';
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
  OPTIONS,
  ServiceUnreachableError,
  ERC20_SHORT_ABI,
  Account,
} from './node.constants';

@Injectable()
export class EthereumNodeService {
  private readonly logger = new ConsoleLogger(EthereumNodeService.name);
  private readonly privateKeys: string[] = [];
  private readonly port: number;

  state?: {
    nodeProcess: ReturnType<typeof spawn>;
    nodeUrl: string;
    accounts: Account[];
  };

  constructor(@Inject(OPTIONS) private options: EthereumNodeServiceOptions) {
    this.port = options.port || 8545;
  }

  private verifyAnvil(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.once('error', () => resolve(false));
      socket.once('timeout', () => resolve(false));
      socket.connect(this.port, '127.0.0.1', () => {
        socket.end();
        resolve(true);
      });
    });
  }

  private startAnvil(rpcUrl: string) {
    const args = [
      `--fork-url=${rpcUrl}`,
      '--block-time=2',
      '--mnemonic=park pond parade curious ten impulse outdoor feel cousin party duck inherit',
    ];
    if (this.options.chainId) args.push(`--chain-id=${this.options.chainId}`);

    const process = spawn('anvil', args, { stdio: 'pipe' });

    process.stdout.once('data', (data: Buffer) => {
      const text = data.toString();
      this.logger.debug(`[Anvil STDOUT] ${text}`);

      const keyMatches = [...text.matchAll(/\(\d+\)\s+(0x[a-fA-F0-9]{64})/g)];
      keyMatches.forEach((match) => this.privateKeys.push(match[1]));
    });

    process.stderr.on('data', (data) => {
      this.logger.error(`[Anvil STDERR] ${data}`);
    });

    process.on('close', (code) => {
      this.logger.warn(`[Anvil Closed] Code ${code}`);
    });

    return process;
  }

  async startNode() {
    if (this.state) return;

    const rpcUrl = this.options.rpcUrl;
    if (!rpcUrl) throw new Error('RPC URL is required');

    this.logger.debug('Starting Anvil node...');
    if (!(await this.ensurePortAvailable(this.port))) {
      this.logger.warn('Port already in use. Cleaning up before restart...');
      await this.stopNode();
    }

    const process = this.startAnvil(rpcUrl);
    const nodeUrl = `http://127.0.0.1:${this.port}`;

    let ready = false;
    for (let i = 0; i < 10; i++) {
      if (await this.verifyAnvil()) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!ready) {
      process.kill();
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

  async stopNode(): Promise<void> {
    if (this.state) {
      this.logger.log('Stopping Node...');
      this.state.nodeProcess.kill();
      this.state = undefined;
    }
  }

  private ensurePortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.once('error', () => resolve(true));
      socket.once('connect', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, '127.0.0.1');
    });
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
}
