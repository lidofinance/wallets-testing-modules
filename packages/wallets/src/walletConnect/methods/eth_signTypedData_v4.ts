import { WCSessionRequest } from '../components';
import { WCWallet } from '../wc.service';

export async function eth_signTypedData_v4(
  this: WCWallet,
  req: WCSessionRequest,
) {
  const typed = req.params.request.params[1];
  const typedData = typeof typed === 'string' ? JSON.parse(typed) : typed;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const signature = await this.walletClient.signTypedData({
    account: this.accounts.getActiveAccount(),
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

  await this.signClient.respond({
    topic: req.topic,
    response: { id: req.id, jsonrpc: '2.0', result: signature },
  });
}
