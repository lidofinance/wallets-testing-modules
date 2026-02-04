import SignClient from '@walletconnect/sign-client';
import { createPublicClient, createWalletClient, HDAccount, http } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { formatEther } from 'viem/utils';
import { WalletPage, WalletPageOptions } from '../wallet.page';
import {
  NetworkConfig,
  WalletConnectTypes,
  WCApproveNamespaces,
} from '../wallets.constants';
import { Page, expect } from '@playwright/test';
import { SUPPORTED_CHAINS } from './constants';

export type WCSessionRequest = {
  topic: string;
  id: number;
  params: {
    chainId: string;
    request: {
      method: string;
      params: any[];
    };
  };
};

export class WCSDKWallet implements WalletPage<WalletConnectTypes.WC_SDK> {
  private client?: SignClient;
  // @ts-ignore
  private publicClient?: ReturnType<typeof createPublicClient>;
  private walletClient?: ReturnType<typeof createWalletClient>;
  private hdAccount: HDAccount;

  private requestQueue: WCSessionRequest[] = [];
  private waiters: Array<(req: WCSessionRequest) => void> = [];
  page?: Page; // not used for WC wallet but required by interface

  constructor(public options: WalletPageOptions) {
    this.hdAccount = mnemonicToAccount(
      this.options.accountConfig.SECRET_PHRASE,
    );

    this.options.walletConfig.walletConnectConfig = {
      requestHandleTimeoutMs: 30_000,
      metadata: {
        name: 'E2E Test Wallet',
        description: 'WalletConnect test wallet for e2e',
        url: 'https://example.wallet',
        icons: ['https://example.wallet/icon.png'],
      },
      namespaces: {
        eip155: {
          accounts: [
            `eip155:${this.options.standConfig.chainId}:${this.hdAccount.address}`,
          ],
          methods: [
            'eth_sendTransaction',
            'personal_sign',
            'eth_signTypedData_v4',
            'wallet_switchEthereumChain',
            'wallet_addEthereumChain',
          ],
          events: ['accountsChanged', 'chainChanged'],
        },
      },
      ...options.walletConfig?.walletConnectConfig,
    };
  }

  async setup(): Promise<void> {
    if (this.client) return;

    this.client = await SignClient.init({
      projectId: this.options.walletConfig.walletConnectConfig.projectId,
      metadata: this.options.walletConfig.walletConnectConfig.metadata,
    });

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
    this.client.on('session_request', (event) => {
      const req = event as unknown as WCSessionRequest;
      console.log(`WC: session_request received: ${req.params.request.method}`);
      const waiter = this.waiters.shift();
      if (waiter) waiter(req);
      else this.requestQueue.push(req);
    });
  }

  async connectWallet(uri: string): Promise<void> {
    await this.setup();
    if (!this.client) throw new Error('WC client not initialized');

    const [proposal] = await Promise.all([
      this.waitForProposalOnce(
        this.options.walletConfig.walletConnectConfig.requestHandleTimeoutMs,
      ),
      this.client.core.pairing.pair({ uri }),
    ]);
    const { id, params } = proposal;

    const namespaces =
      this.options.walletConfig.walletConnectConfig.namespaces ??
      this.buildNamespacesFromProposal(params);

    const { acknowledged } = await this.client.approve({ id, namespaces });
    await acknowledged();
  }

  async disconnect(): Promise<void> {
    if (!this.client) throw new Error('WC client not initialized');

    const sessions = this.client.session.getAll();
    for (const sess of sessions) {
      console.log('WC: disconnecting session', sess.topic);
      await this.client.disconnect({
        topic: sess.topic,
        reason: {
          code: 6000,
          message: 'Session disconnected by test wallet',
        },
      });
    }
    await this.client.core.relayer.transportClose();
    this.client = undefined;
    this.requestQueue = [];
    this.waiters = [];
  }

  async nextRequest(timeoutMs?: number): Promise<WCSessionRequest> {
    if (!timeoutMs) {
      timeoutMs =
        this.options.walletConfig.walletConnectConfig.requestHandleTimeoutMs;
    }

    const queued = this.requestQueue.shift();
    if (queued) return queued;

    return await new Promise<WCSessionRequest>((resolve, reject) => {
      const t = setTimeout(() => {
        const idx = this.waiters.indexOf(resolve);
        if (idx >= 0) this.waiters.splice(idx, 1);
        reject(new Error(`WC: session_request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.waiters.push((req) => {
        clearTimeout(t);
        resolve(req);
      });
    });
  }

  isWCSessionRequest(x: any): x is WCSessionRequest {
    return (
      x && typeof x === 'object' && 'topic' in x && 'id' in x && 'params' in x
    );
  }

  async confirmTx(req?: WCSessionRequest | Page): Promise<void> {
    if (!req) {
      req = await this.nextRequest();
    }

    if (!this.isWCSessionRequest(req)) {
      throw new Error(
        'WC: confirmTx with Page parameter is not supported in WC wallet',
      );
    }

    if (!this.client) throw new Error('WC client not initialized');

    const method = req.params.request.method;
    if (method === 'eth_sendTransaction') {
      const fees = await this.publicClient.estimateFeesPerGas();
      const value = req.params.request.params[0].value
        ? BigInt(req.params.request.params[0].value)
        : undefined;
      const hash = await this.walletClient.sendTransaction({
        ...req.params.request.params[0],
        value,
        gas: BigInt(req.params.request.params[0].gas),
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });

      await this.client.respond({
        topic: req.topic,
        response: { id: req.id, jsonrpc: '2.0', result: hash },
      });
    } else if (method === 'eth_signTypedData_v4') {
      const typed = req.params.request.params[1];
      const typedData = typeof typed === 'string' ? JSON.parse(typed) : typed;

      const signature = await this.walletClient.signTypedData({
        account: this.hdAccount,
        domain: {
          ...typedData.domain,
          chainId: Number(typedData.domain.chainId),
        },
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: {
          ...typedData.message,
          value: BigInt(typedData.message.value),
          nonce: BigInt(typedData.message.nonce),
          deadline: BigInt(typedData.message.deadline),
        },
      });
      console.log('Signature was created.');

      await this.client.respond({
        topic: req.topic,
        response: { id: req.id, jsonrpc: '2.0', result: signature },
      });
    } else {
      throw new Error(`WC: approveRequest unsupported method: ${method}`);
    }
  }

  async cancelTx(
    req?: WCSessionRequest | Page,
    message = 'User rejected the request',
    code = 4001,
  ): Promise<void> {
    if (!req) {
      req = await this.nextRequest();
    }
    if (!this.isWCSessionRequest(req)) {
      throw new Error(
        'WC: confirmTx with Page parameter is not supported in WC wallet',
      );
    }
    if (!this.client) throw new Error('WC client not initialized');

    await this.client.respond({
      topic: req.topic,
      response: {
        id: req.id,
        jsonrpc: '2.0',
        error: { code, message },
      },
    });
  }

  getTx(req: WCSessionRequest, index = 0): any {
    return req.params?.request?.params?.[index];
  }

  private async waitForProposalOnce(timeoutMs: number) {
    if (!this.client) throw new Error('WC client not initialized');

    return await new Promise<any>((resolve, reject) => {
      const t = setTimeout(
        () =>
          reject(
            new Error(`WC: session_proposal timeout after ${timeoutMs}ms`),
          ),
        timeoutMs,
      );

      this.client.once('session_proposal', (proposal) => {
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

    const accounts = (
      this.options.walletConfig.walletConnectConfig.namespaces?.eip155
        ?.accounts ?? []
    ).length
      ? this.options.walletConfig.walletConnectConfig.namespaces.eip155.accounts
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

  importKey(secretKey: string, withChecks?: boolean): Promise<void> {
    throw new Error('Method not implemented.');
  }

  assertTxAmount(req: WCSessionRequest, expectedAmount: string): void {
    const tx = this.getTx(req);

    if (tx.method === 'eth_sendTransaction') {
      const txAmount = formatEther(BigInt(tx.value));
      expect(txAmount).toEqual(expectedAmount);
    }
  }

  assertReceiptAddress(req: WCSessionRequest, expectedAddress: string): void {
    const tx = this.getTx(req);

    if (tx.method === 'eth_sendTransaction') {
      expect(tx.to).toEqual(expectedAddress);
    }
  }

  addNetwork(
    networkConfig: NetworkConfig,
    isClosePage?: boolean,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
