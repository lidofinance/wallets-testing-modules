import { WCSessionRequest } from '../components';
import { WCWallet } from '../wc.service';

export async function wallet_getCapabilities(
  this: WCWallet,
  req: WCSessionRequest,
) {
  console.log(
    'Responding to wallet_getCapabilities with wallet_watchAsset support',
  );
  await this.signClient.respond({
    topic: req.topic,
    response: {
      id: req.id,
      jsonrpc: '2.0',
      result: {
        wallet_watchAsset: true,
      },
    },
  });
}
