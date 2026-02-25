import { WCSessionRequest } from '../components';
import { WCWallet } from '../wc.service';

export async function eth_sendTransaction(
  this: WCWallet,
  req: WCSessionRequest,
) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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

  await this.signClient.respond({
    topic: req.topic,
    response: { id: req.id, jsonrpc: '2.0', result: hash },
  });
}
