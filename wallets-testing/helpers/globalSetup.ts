// import { ANVIL_HOST, ANVIL_PORT } from 'modules/config';
// import { env } from 'modules/env';
import fetch from 'node-fetch';
import { ANVIL_HOST, ANVIL_PORT } from '../scripts/start-node';

export default async function globalSetup() {
  await waitForFork(`http://${ANVIL_HOST}:${ANVIL_PORT}`);
}

interface WaitOptions {
  timeoutMs?: number;
}

export async function waitForFork(
  rpcUrl: string,
  { timeoutMs = 30000 }: WaitOptions = {},
): Promise<void> {
  const start = Date.now();
  console.log(`Starting to wait for fork (timeout ${timeoutMs}ms)`);
  while (Date.now() - start < timeoutMs) {
    console.log(`Try to sending eth_blockNumber...`);
    try {
      const res = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
        timeout: 1000,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          return;
        }
      }
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      console.log(error.message);
    }
  }

  throw new Error(`Fork did not become ready within ${timeoutMs} ms`);
}
