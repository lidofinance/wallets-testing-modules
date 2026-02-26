import { WCSessionRequest } from '../components';
import { WCWallet } from '../wc.service';

export async function wallet_watchAsset(this: WCWallet, req: WCSessionRequest) {
  const params = req.params.request.params;

  const account = this.accounts.getActiveAccount().address.toLowerCase();

  if (params?.type === 'ERC20' && params?.options?.address) {
    const list = this.watchedTokensByAccount.get(account) ?? [];

    list.push({
      address: params.options.address.toLowerCase(),
      symbol: params.options.symbol,
      decimals: params.options.decimals,
    });

    this.watchedTokensByAccount.set(account, list);
  }

  await this.signClient.respond({
    topic: req.topic,
    response: {
      id: req.id,
      jsonrpc: '2.0',
      result: true,
    },
  });
}
