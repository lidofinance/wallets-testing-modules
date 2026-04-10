import { WCSessionRequest } from '../components';
import { WCWallet } from '../wc.service';

export async function eth_signTypedData_v4(
  this: WCWallet,
  req: WCSessionRequest,
) {
  const typed = req.params.request.params[1];
  const typedData = typeof typed === 'string' ? JSON.parse(typed) : typed;

  const primaryType = typedData.primaryType;
  const typeFields: { name: string; type: string }[] =
    typedData.types[primaryType] ?? [];

  const message = Object.fromEntries(
    Object.entries(typedData.message).map(([key, val]) => {
      const field = typeFields.find((f) => f.name === key);
      if (field && /^uint\d*$|^int\d*$/.test(field.type)) {
        return [key, BigInt(val as string)];
      }
      return [key, val];
    }),
  );

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
    message,
  });

  await this.signClient.respond({
    topic: req.topic,
    response: { id: req.id, jsonrpc: '2.0', result: signature },
  });
}
