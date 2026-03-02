import { WCSessionRequest } from '../components';
import { WCWallet } from '../wc.service';

export async function personal_sign(this: WCWallet, req: WCSessionRequest) {
  await this.signClient.respond({
    topic: req.topic,
    response: {
      id: req.id,
      jsonrpc: '2.0',
      result: true,
    },
  });
}
