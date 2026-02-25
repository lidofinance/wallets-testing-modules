import SignClient from '@walletconnect/sign-client';
import {
  createPublicClient,
  createWalletClient,
  HDAccount,
  http,
  formatEther,
  formatUnits,
  Chain,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { test } from '@playwright/test';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import { NetworkConfig, WCApproveNamespaces } from '../wallets.constants';
import { expect } from '@playwright/test';
import { SUPPORTED_CHAINS } from './constants';
import {
  NetworkSettings,
  RequestManager,
  WCSessionRequest,
} from './components';
import {
  eth_sendTransaction,
  eth_signTypedData_v4,
  wallet_watchAsset,
} from './methods';
import { wallet_getCapabilities } from './methods/wallet_getCapabilities';

type WatchedToken = {
  address: `0x${string}`;
  symbol?: string;
  decimals?: number;
};

const handlers: Record<string, (req: WCSessionRequest) => Promise<void>> = {
  eth_sendTransaction: eth_sendTransaction,
  eth_signTypedData_v4: eth_signTypedData_v4,
  wallet_watchAsset: wallet_watchAsset,
};

export class WCWallet implements WalletPage {
  protected signClient?: SignClient;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  protected publicClient?: ReturnType<typeof createPublicClient>;
  protected walletClient?: ReturnType<typeof createWalletClient>;
  protected hdAccount: HDAccount;
  protected defaultTimeoutMs: number;
  protected namespaces?: WCApproveNamespaces;

  protected watchedTokensByAccount: Map<string, WatchedToken[]> = new Map();

  // network settings
  private networkSettings: NetworkSettings;
  private requestManager: RequestManager;

  constructor(public options: WalletPageOptions) {
    this.hdAccount = mnemonicToAccount(
      this.options.accountConfig.SECRET_PHRASE,
    );
    this.defaultTimeoutMs = 30000;
    this.namespaces = {
      eip155: {
        accounts: [
          `eip155:${this.options.standConfig.chainId}:${this.hdAccount.address}`,
        ],
        methods: [
          'eth_sendTransaction',
          'personal_sign',
          'eth_signTypedData_v4',
          'wallet_watchAsset',
          'wallet_getCapabilities',
        ],
        events: ['accountsChanged', 'chainChanged'],
      },
    };
  }

  async setup(): Promise<void> {
    await test.step('Setup wallet', async () => {
      if (this.signClient) return;

      this.signClient = await SignClient.init({
        projectId: this.options.walletConfig.WC_PROJECT_ID,
      });

      this.networkSettings = new NetworkSettings(
        this.signClient,
        this.hdAccount,
      );
      this.requestManager = new RequestManager();

      this.walletClient = createWalletClient({
        account: this.hdAccount,
        chain: SUPPORTED_CHAINS[this.options.standConfig.chainId],
        transport: http(this.options.standConfig.rpcUrl),
      });

      this.publicClient = createPublicClient({
        chain: SUPPORTED_CHAINS[this.options.standConfig.chainId],
        transport: http(this.options.standConfig.rpcUrl),
      });

      // Collect incoming requests into an async queue
      this.signClient.on('session_request', async (event) => {
        const req = event as unknown as WCSessionRequest;
        const method = req.params.request.method;

        if (method === 'wallet_getCapabilities') {
          await wallet_getCapabilities.call(this, req);
          return;
        }

        console.log(
          `WC: session_request received: ${req.params.request.method}`,
        );
        const waiter = this.requestManager.waiters.shift();
        if (waiter) waiter(req);
        else this.requestManager.queue.push(req);
      });

      this.networkSettings.setActiveChainId(this.options.standConfig.chainId);
    });
  }

  async connectWallet(uri: string): Promise<void> {
    await this.setup();

    await test.step('Connect wallet', async () => {
      if (!this.signClient) throw new Error('WC client not initialized');

      let proposal;
      await test.step(`Pairing`, async () => {
        [proposal] = await Promise.all([
          this.waitForProposalOnce(this.defaultTimeoutMs),
          this.signClient.core.pairing.pair({ uri }),
        ]);
      });
      const { id, params } = proposal;

      const namespaces =
        this.namespaces ?? this.buildNamespacesFromProposal(params);

      await test.step(`Approve session`, async () => {
        const { acknowledged } = await this.signClient.approve({
          id,
          namespaces,
        });
        await acknowledged();
      });
    });
  }

  async disconnect(): Promise<void> {
    await test.step('Disconnect wallet', async () => {
      if (!this.signClient) throw new Error('WC client not initialized');

      const sessions = this.signClient.session.getAll();
      for (const sess of sessions) {
        console.log('WC: disconnecting session', sess.topic);
        await this.signClient.disconnect({
          topic: sess.topic,
          reason: {
            code: 6000,
            message: 'Session disconnected by test wallet',
          },
        });
      }
      await this.signClient.core.relayer.transportClose();
      this.signClient = undefined;
      this.requestManager.queue = [];
      this.requestManager.waiters = [];
    });
  }

  async confirmTx(): Promise<void> {
    await test.step('Confirm transaction', async () => {
      let request = await this.requestManager.getCurrentRequest();
      request = await this.requestManager.validateRequest(request);

      if (!this.signClient) throw new Error('WC client not initialized');

      const method = request.params.request.method;

      const handler = handlers[method];
      if (!handler) {
        throw new Error(`WC: unsupported method: ${method}`);
      }
      await handler.call(this, request);

      this.requestManager.resolveRequest(request);
    });
  }

  async confirmAddTokenToWallet(): Promise<void> {
    await test.step('Confirm add token to wallet', async () => {
      let request = await this.requestManager.getCurrentRequest();
      request = await this.requestManager.validateRequest(request);

      if (!this.signClient) throw new Error('WC client not initialized');

      const method = request.params.request.method;

      if (method !== 'wallet_watchAsset') {
        throw new Error(
          `WC: unsupported method for confirm add token to wallet: ${method}`,
        );
      }

      this.requestManager.resolveRequest(request);
    });
  }

  async cancelTx(): Promise<void> {
    await test.step('Cancel transaction', async () => {
      let request = await this.requestManager.getCurrentRequest();
      request = await this.requestManager.validateRequest(request);

      if (!this.signClient) throw new Error('WC client not initialized');

      await this.signClient.respond({
        topic: request.topic,
        response: {
          id: request.id,
          jsonrpc: '2.0',
          error: { code: 4001, message: 'User rejected the request' },
        },
      });

      this.requestManager.resolveRequest(request);
    });
  }

  async cancelAllTxRequests() {
    // @todo: think about it later
    // while (
    //   this.requestManager.queue.length > 0 ||
    //   this.requestManager.pendings.length > 0
    // ) {
    //   const req =
    //     this.requestManager.queue.shift() ||
    //     this.requestManager.pendings.shift() ||
    //     null;
    //   if (req) await this.cancelTx(req);
    // }
  }

  private async waitForProposalOnce(timeoutMs: number) {
    if (!this.signClient) throw new Error('WC client not initialized');

    return new Promise<any>((resolve, reject) => {
      const t = setTimeout(
        () =>
          reject(
            new Error(`WC: session_proposal timeout after ${timeoutMs}ms`),
          ),
        timeoutMs,
      );

      this.signClient.once('session_proposal', (proposal) => {
        clearTimeout(t);
        resolve(proposal);
      });
    });
  }

  private buildNamespacesFromProposal(params: any): WCApproveNamespaces {
    const required = params?.requiredNamespaces ?? {};
    const eip155 = required?.eip155;

    if (!eip155) {
      throw new Error(`WC: requiredNamespaces.eip155 missing in proposal`);
    }

    const chains: string[] = eip155.chains ?? [];
    const methods: string[] = eip155.methods ?? [];
    const events: string[] = eip155.events ?? [];

    // If dApp didn't specify chains (rare), you must provide at least one.
    if (!chains.length) {
      throw new Error(
        `WC: proposal has no chains in requiredNamespaces.eip155`,
      );
    }

    const accounts = (this.namespaces?.eip155?.accounts ?? []).length
      ? this.namespaces.eip155.accounts
      : [];

    if (!accounts.length) {
      throw new Error(
        `WC: cannot auto-build accounts. Pass namespaces with accounts (e.g. eip155:1:0x...).`,
      );
    }

    return {
      eip155: {
        accounts,
        methods,
        events,
      },
    };
  }

  async getTokenBalance(tokenName: string): Promise<number> {
    return test.step(`Get balance for token ${tokenName}`, async () => {
      const contractAddress = this.watchedTokensByAccount
        .get(this.hdAccount.address.toLowerCase())
        ?.find((t) => t.symbol === tokenName)?.address;

      if (contractAddress) {
        return test.step(`Read balance from contract ${contractAddress}`, async () => {
          const balance = await this.publicClient.readContract({
            address: contractAddress,
            abi: [
              {
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'owner', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }],
              },
            ],
            functionName: 'balanceOf',
            args: [this.hdAccount.address],
          });
          return Number(formatUnits(balance, 18));
        });
      }
      throw new Error(`Token ${tokenName} not found in watched tokens`);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  importKey(secretKey: string, withChecks?: boolean): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async assertTxAmount(expectedAmount: string): Promise<void> {
    await test.step(`Assert transaction amount ${expectedAmount} ETH`, async () => {
      const request = await this.requestManager.getCurrentRequest();
      expect(
        request,
        'Not found pending request for check transaction amount',
      ).not.toBeUndefined();

      const requestInfo = this.requestManager.getRequestInfo(request);

      if (requestInfo.method === 'eth_sendTransaction') {
        const txAmount = formatEther(BigInt(requestInfo.params.value));
        expect(txAmount).toEqual(expectedAmount);
      }
    });
  }

  async assertReceiptAddress(expectedAddress: string): Promise<void> {
    await test.step(`Assert transaction receipt address ${expectedAddress}`, async () => {
      const request = await this.requestManager.getCurrentRequest();
      expect(
        request,
        'Not found pending request for check transaction receipt address',
      ).not.toBeUndefined();

      const requestInfo = this.requestManager.getRequestInfo(request);
      if (requestInfo.method === 'eth_sendTransaction') {
        expect(requestInfo.params.to.toLowerCase()).toEqual(
          expectedAddress.toLowerCase(),
        );
      }
    });
  }

  async setupNetwork(networkConfig: NetworkConfig): Promise<void> {
    await test.step(`Setup network ${networkConfig.chainName} (${networkConfig.chainId})`, async () => {
      await this.networkSettings.setupNetwork(networkConfig);
    });
  }

  async addNetwork(networkConfig: NetworkConfig): Promise<void> {
    await test.step(`Add network ${networkConfig.chainName} (${networkConfig.chainId})`, async () => {
      await this.networkSettings.addNetwork(networkConfig);
    });
  }

  async changeNetwork(networkName: string): Promise<void> {
    await test.step(`Change network to ${networkName}`, async () => {
      const chain = await this.networkSettings.changeNetwork(networkName);
      this.rebuildViemClients(chain);
    });
  }

  async getWalletAddress(): Promise<string> {
    return this.hdAccount.address.toLowerCase();
  }

  private async rebuildViemClients(chain: Chain) {
    test.step(`Rebuild Viem clients for chain ${chain.id}`, async () => {
      const net = this.networkSettings.networksByChainId.get(chain.id);
      if (net?.rpcUrl) {
        this.walletClient = createWalletClient({
          account: this.hdAccount,
          chain,
          transport: http(net.rpcUrl),
        });

        this.publicClient = createPublicClient({
          chain,
          transport: http(net.rpcUrl),
        });
      } else {
        this.walletClient = null;
        this.publicClient = null;
      }
    });
  }
}
