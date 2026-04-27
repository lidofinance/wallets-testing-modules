import { ConsoleLogger } from '@nestjs/common';
import SignClient from '@walletconnect/sign-client';
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  formatUnits,
  Chain,
} from 'viem';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { test, expect } from '@playwright/test';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import { NetworkConfig, WCApproveNamespaces } from '../wallets.constants';
import { SUPPORTED_CHAINS } from './constants';
import {
  Accounts,
  NetworkSettings,
  RequestManager,
  WCSessionRequest,
} from './components';
import {
  eth_sendTransaction,
  eth_signTypedData_v4,
  wallet_watchAsset,
  wallet_getCapabilities,
  personal_sign,
} from './methods';

type WatchedToken = {
  address: `0x${string}`;
  symbol?: string;
  decimals?: number;
};

const handlers: Record<string, (req: WCSessionRequest) => Promise<void>> = {
  eth_sendTransaction: eth_sendTransaction,
  eth_signTypedData_v4: eth_signTypedData_v4,
  wallet_watchAsset: wallet_watchAsset,
  wallet_getCapabilities: wallet_getCapabilities,
  personal_sign: personal_sign,
};

const logger = new ConsoleLogger('WCWallet');

export class WCWallet implements WalletPage {
  protected signClient?: SignClient;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  protected publicClient?: ReturnType<typeof createPublicClient>;
  protected walletClient?: ReturnType<typeof createWalletClient>;
  protected defaultTimeoutMs: number;
  protected namespaces?: WCApproveNamespaces;

  protected watchedTokensByAccount: Map<string, WatchedToken[]> = new Map();

  // network settings
  private networkSettings: NetworkSettings;
  private requestManager: RequestManager;
  protected accounts: Accounts;
  private projectId: string;

  constructor(public options: WalletPageOptions) {
    this.defaultTimeoutMs = 30000;
    this.namespaces = {
      eip155: {
        accounts: [],
        chains: ['eip155:1', 'eip155:560048'],
        methods: [
          'eth_sendTransaction',
          'personal_sign',
          'eth_signTypedData_v4',
          'wallet_watchAsset',
          'wallet_getCapabilities',
          'wallet_switchEthereumChain',
        ],
        events: ['accountsChanged', 'chainChanged'],
      },
    };
    this.projectId = process.env.WC_PROJECT_ID;
    if (!this.projectId)
      logger.error('WC_PROJECT_ID is not defined in the env');
  }

  private async onSessionRequest(event: any) {
    const req = event as unknown as WCSessionRequest;
    const method = req.params.request.method;

    if (method === 'wallet_getCapabilities') {
      const handler = handlers[method];
      if (!handler) {
        throw new Error(`WC: unsupported method: ${method}`);
      }

      await handler.call(this, req);
      return;
    }

    logger.log(`event received: ${req.params.request.method}`);
    const waiter = this.requestManager.waiters.shift();
    if (waiter) waiter(req);
    else this.requestManager.queue.push(req);
  }

  async setup(): Promise<void> {
    const account = mnemonicToAccount(this.options.accountConfig.SECRET_PHRASE);

    await test.step('Setup wallet', async () => {
      if (this.signClient) return;
      this.signClient = await SignClient.init({ projectId: this.projectId });

      this.networkSettings = new NetworkSettings(this.signClient, account);
      this.requestManager = new RequestManager();
      this.accounts = new Accounts();

      this.walletClient = createWalletClient({
        account: account,
        chain: SUPPORTED_CHAINS[this.options.standConfig.chainId],
        transport: http(this.options.standConfig.rpcUrl),
      });

      this.publicClient = createPublicClient({
        chain: SUPPORTED_CHAINS[this.options.standConfig.chainId],
        transport: http(this.options.standConfig.rpcUrl),
      });

      // Collect incoming requests into an async queue
      this.signClient.on('session_request', this.onSessionRequest.bind(this));

      this.accounts.setActiveAccount(account);

      this.namespaces.eip155.accounts = [
        this.accounts.getEip115Account(
          this.options.standConfig.chainId,
          account.address,
        ),
      ];

      this.networkSettings.setActiveChainId(this.options.standConfig.chainId);
    });
  }

  async connectWallet(uri: string): Promise<void> {
    await this.setup();

    await test.step('Connect wallet', async () => {
      if (!this.signClient) throw new Error('WC client not initialized');

      const proposal = await test.step(`Pairing`, async () => {
        const [proposal] = await Promise.all([
          this.waitForProposalOnce(this.defaultTimeoutMs),
          this.signClient.core.pairing.pair({ uri }),
        ]);
        return proposal;
      });

      const { id, params } = proposal;

      const namespaces =
        this.namespaces ?? this.buildNamespacesFromProposal(params);
      const activeAccount = this.accounts.getActiveAccount();

      this.namespaces.eip155.accounts = [
        this.accounts.getEip115Account(
          this.options.standConfig.chainId,
          activeAccount.address,
        ),
      ];

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

      await test.step('Disconnecting all sessions', async () => {
        const sessions = this.signClient.session.getAll();
        for (const sess of sessions) {
          logger.log('WC: disconnecting session', sess.topic);
          await this.signClient.disconnect({
            topic: sess.topic,
            reason: {
              code: 6000,
              message: 'Session disconnected by test wallet',
            },
          });
          this.signClient.off(
            'session_request',
            this.onSessionRequest.bind(this),
          );
        }
      });

      await test.step('Disconnecting all pairings', async () => {
        const pairings = this.signClient.core.pairing.getPairings() ?? [];
        for (const pairing of pairings) {
          logger.log('WC: disconnecting pairing', pairing.topic);
          await this.signClient.core.pairing.disconnect?.({
            topic: pairing.topic,
          });
        }
      });

      await test.step('Closing relayer transport', async () => {
        await this.signClient.core.relayer.transportClose();
      });

      await test.step('Resetting local state', async () => {
        this.requestManager.clear();
        this.signClient = undefined;
      });
    });
  }

  async confirmTx(): Promise<void> {
    await test.step('Confirm transaction', async () => {
      const request = await this.requestManager.getCurrentRequest();
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
      const request = await this.requestManager.getCurrentRequest();
      if (!this.signClient) throw new Error('WC client not initialized');

      const method = request.params.request.method;

      if (method !== 'wallet_watchAsset') {
        throw new Error(
          `WC: unsupported method for confirm add token to wallet: ${method}`,
        );
      }

      const handler = handlers[method];
      if (!handler) {
        throw new Error(`WC: unsupported method: ${method}`);
      }

      await handler.call(this, request);

      this.requestManager.resolveRequest(request);
    });
  }

  async cancelTx(): Promise<void> {
    await test.step('Cancel transaction', async () => {
      const request = await this.requestManager.getCurrentRequest();
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

  private async waitForProposalOnce(timeoutMs: number) {
    if (!this.signClient) throw new Error('WC client not initialized');

    return new Promise<any>((resolve, reject) => {
      const handler = (proposal: any) => {
        clearTimeout(t);
        resolve(proposal);
      };
      const t = setTimeout(() => {
        this.signClient?.off('session_proposal', handler);
        reject(new Error(`WC: session_proposal timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.signClient.once('session_proposal', handler);
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
        chains,
        methods,
        events,
      },
    };
  }

  async getTokenBalance(tokenName: string): Promise<number> {
    return test.step(`Get balance for token ${tokenName}`, async () => {
      const activeAccount = this.accounts.getActiveAccount();
      const contractAddress = this.watchedTokensByAccount
        .get(activeAccount.address.toLowerCase())
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
            args: [activeAccount.address],
          });
          return Number(formatUnits(balance, 18));
        });
      }
      throw new Error(`Token ${tokenName} not found in watched tokens`);
    });
  }

  async assertTxAmount(expectedAmount: string): Promise<void> {
    await test.step(`Assert transaction amount ${expectedAmount} ETH`, async () => {
      const request = await this.requestManager.getCurrentRequest();
      expect(request, 'The request must not be undefined').not.toBeUndefined();

      const requestInfo = this.requestManager.getRequestInfo(request);
      switch (requestInfo.method) {
        case 'eth_sendTransaction': {
          const txAmount = formatEther(BigInt(requestInfo.params[0].value));
          expect(txAmount).toEqual(expectedAmount);
          break;
        }
        case 'eth_signTypedData_v4': {
          const paramJson = JSON.parse(requestInfo.params[1]);
          const txAmount = formatEther(BigInt(paramJson.message.sellAmount));
          expect(txAmount).toEqual(expectedAmount);
          break;
        }
        default:
          logger.error(
            `${requestInfo.method} is not defined to check tx amount`,
          );
      }
    });
  }

  async assertReceiptAddress(expectedAddress: string): Promise<void> {
    await test.step(`Assert transaction receipt address ${expectedAddress}`, async () => {
      const request = await this.requestManager.getCurrentRequest();
      expect(request, 'The request must not be undefined').not.toBeUndefined();

      const requestInfo = this.requestManager.getRequestInfo(request);
      switch (requestInfo.method) {
        case 'eth_sendTransaction': {
          expect(requestInfo.params[0].to.toLowerCase()).toEqual(
            expectedAddress.toLowerCase(),
          );
          break;
        }
        case 'eth_signTypedData_v4': {
          const paramJson = JSON.parse(requestInfo.params[1]);
          expect(paramJson.domain.verifyingContract).toEqual(
            expectedAddress.toLowerCase(),
          );
          break;
        }
        default:
          logger.error(
            `${requestInfo.method} is not defined to check tx address`,
          );
      }
    });
  }

  async setupNetwork(networkConfig: NetworkConfig): Promise<void> {
    await test.step(`Setup network ${networkConfig.chainName} (${networkConfig.chainId})`, () => {
      this.networkSettings.setupNetwork(networkConfig);
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
    return test.step(`Get wallet address`, async () => {
      const activeAccount = this.accounts.getActiveAccount();
      return activeAccount.address.toLowerCase();
    });
  }

  async isWalletAddressExist(address: string): Promise<boolean> {
    return test.step(`Check if wallet address ${address} exist`, () => {
      return this.accounts.isWalletAddressExist(address);
    });
  }

  private async updateAllSessionsNamespaces(): Promise<void> {
    if (!this.signClient) throw new Error('WC client not initialized');

    const sessions = this.signClient.session.getAll();
    for (const sess of sessions) {
      await this.signClient.update({
        topic: sess.topic,
        namespaces: this.namespaces,
      });
    }
  }

  async importKey(secretKey: string, withChecks?: boolean): Promise<void> {
    const key = secretKey.startsWith('0x') ? secretKey : `0x${secretKey}`;
    const account = privateKeyToAccount(key as `0x${string}`);

    await test.step(`Import Key for ${account.address}`, async () => {
      const target = account.address.toLowerCase();

      if (withChecks) {
        const currentWalletAddress = await this.getWalletAddress();
        const current = currentWalletAddress.toLowerCase();
        if (current === target) return;
      }

      const isExist = await this.isWalletAddressExist(target);

      if (isExist) {
        await this.changeWalletAccountByAddress(target);
        return;
      }

      this.accounts.setActiveAccount(account);
      this.namespaces.eip155.accounts = [
        this.accounts.getEip115Account(
          this.networkSettings.activeChainId,
          target,
        ),
      ];

      const chain = SUPPORTED_CHAINS[this.networkSettings.activeChainId];
      this.rebuildViemClients(chain);
      await this.updateAllSessionsNamespaces();
    });
  }

  async changeWalletAccountByName?(accountName: string): Promise<void> {
    await test.step(`Change wallet account to ${accountName}`, async () => {
      logger.warn(`Not implemented changeWalletAccountByName`);
    });
  }

  async changeWalletAccountByAddress?(address: string): Promise<void> {
    await test.step(`Change wallet account to ${address}`, async () => {
      const account = this.accounts.getAccountByAddress(address);

      this.accounts.setActiveAccount(account);
      this.namespaces.eip155.accounts = [
        this.accounts.getEip115Account(
          this.networkSettings.activeChainId,
          account.address,
        ),
      ];

      const chain = SUPPORTED_CHAINS[this.networkSettings.activeChainId];
      this.rebuildViemClients(chain);
      await this.updateAllSessionsNamespaces();
    });
  }

  private rebuildViemClients(chain: Chain) {
    test.step(`Rebuild Viem clients for chain ${chain.id}`, () => {
      const networkConfig =
        this.networkSettings.networksByChainId.get(chain.id) ||
        this.options.standConfig;

      if (!networkConfig) {
        throw new Error(
          `Network config not found for chain ${chain.id} in network settings or stand config`,
        );
      }

      this.walletClient = createWalletClient({
        account: this.accounts.getActiveAccount(),
        chain,
        transport: http(networkConfig.rpcUrl),
      });

      this.publicClient = createPublicClient({
        chain,
        transport: http(networkConfig.rpcUrl),
      });
      logger.log(`Viem clients rebuilt for chain ${chain.id} `);
    });
  }
}
