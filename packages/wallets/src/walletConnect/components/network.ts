import { Account, Chain } from 'viem';
import { NetworkConfig } from '../../wallets.constants';
import { SUPPORTED_CHAINS, buildChainFromNetwork } from '../constants';
import { SignClient } from '@walletconnect/sign-client/dist/types/client';

export class NetworkSettings {
  public activeChainId: number;
  public networksByChainId = new Map<number, NetworkConfig>();
  public chainIdByName = new Map<string, number>();

  constructor(private client: SignClient, private account: Account) {}

  private normalizeChainName(name: string) {
    return name.trim().toLowerCase();
  }

  private getActiveSession() {
    if (!this.client) throw new Error('WC client not initialized');
    const sessions = this.client.session.getAll();
    const session = sessions[0];
    if (!session) throw new Error('No active WC session');
    return session;
  }

  setActiveChainId(chainId: number) {
    this.activeChainId = chainId;
  }

  setupNetwork(networkConfig: NetworkConfig): void {
    this.networksByChainId.set(networkConfig.chainId, networkConfig);
    this.chainIdByName.set(
      this.normalizeChainName(networkConfig.chainName),
      networkConfig.chainId,
    );
  }

  async addNetwork(networkConfig: NetworkConfig): Promise<void> {
    if (!this.client) throw new Error('WC client not initialized');

    const session = this.getActiveSession();
    const ns = session.namespaces?.eip155;
    if (!ns) throw new Error('Session has no eip155 namespace');

    const addr = this.account.address;
    const newAccount = `eip155:${networkConfig.chainId}:${addr}`;

    const newNamespaces = {
      ...session.namespaces,
      eip155: {
        accounts: Array.from(new Set([...(ns.accounts ?? []), newAccount])),
        methods: ns.methods ?? [],
        events: ns.events ?? [],
      },
    };

    await this.client.update({
      topic: session.topic,
      namespaces: newNamespaces,
    });

    this.networksByChainId.set(networkConfig.chainId, networkConfig);
    this.chainIdByName.set(
      this.normalizeChainName(networkConfig.chainName),
      networkConfig.chainId,
    );
  }

  async changeNetwork(networkName: string): Promise<Chain> {
    if (!this.client) throw new Error('WC client not initialized');

    const normalized = this.normalizeChainName(networkName);
    const chainId = this.chainIdByName.get(normalized);
    const networkConfig = this.networksByChainId.get(chainId);

    if (!chainId) {
      const known = Array.from(this.chainIdByName.keys()).sort();
      throw new Error(
        `Unknown network "${networkName}". Registered networks: ${known.join(
          ', ',
        )}`,
      );
    }

    if (chainId === this.activeChainId) {
      console.log(`Network "${networkName}" is already active`);
      return SUPPORTED_CHAINS[chainId] ?? buildChainFromNetwork(networkConfig);
    }

    const session = this.getActiveSession();
    await this.client.emit({
      topic: session.topic,
      chainId: `eip155:${chainId}`,
      event: { name: 'chainChanged', data: `0x${chainId.toString(16)}` },
    });
    const chain =
      SUPPORTED_CHAINS[chainId] ?? buildChainFromNetwork(networkConfig);
    this.setActiveChainId(chain.id);

    return chain;
  }
}
