import { isHex, isAddress } from 'viem';
import type { WCSessionRequest } from '../components';
import type { WCWallet } from '../wc.service';

export async function personal_sign(this: WCWallet, req: WCSessionRequest) {
  const respond = (response: any) =>
    this.signClient.respond({ topic: req.topic, response });

  try {
    const account = this.accounts.getActiveAccount();

    const params = req.params.request.params;
    if (!Array.isArray(params) || params.length < 2) {
      throw new Error('personal_sign: invalid params');
    }

    const message = String(params.find((x) => !isAddress(x)) ?? '');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const signature = await this.walletClient.signMessage({
      account,
      message: isHex(message) ? { raw: message } : message,
    });

    return respond({ id: req.id, jsonrpc: '2.0', result: signature });
  } catch (err: any) {
    return respond({
      id: req.id,
      jsonrpc: '2.0',
      error: { code: 4001, message: err?.message ?? 'personal_sign rejected' },
    });
  }
}
