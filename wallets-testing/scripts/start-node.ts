import { spawn } from 'child_process';
import net from 'net';
import { mnemonicToAccount } from 'viem/accounts';
import { http, keccak256, encodeAbiParameters, createTestClient } from 'viem';
import { foundry } from 'viem/chains';
import { configService, ETHEREUM_WIDGET_CONFIG } from '../config';

export const ANVIL_PORT = 8545;
export const ANVIL_HOST = '127.0.0.1';

const unsafeStartAnvil = async (rpcUrl: string) => {
  const process = spawn('anvil', [`--fork-url=${rpcUrl}`, '--block-time=2'], {
    stdio: 'pipe',
  });

  process.stdout.on('data', (data) => {
    console.log(`[Anvil]\n${data}`);
  });

  process.stderr.on('data', (data) => {
    console.error(`[Anvil]\n${data}`);
  });

  process.on('close', (code) => {
    console.log(`[Anvil] Closed with code ${code}`);
  });

  return process;
};

const verifyAnvil = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(1000);

    socket.once('error', () => {
      resolve(false);
    });

    socket.once('timeout', () => {
      resolve(false);
    });

    socket.connect(ANVIL_PORT, ANVIL_HOST, () => {
      socket.end();
      resolve(true);
    });
  });
};

const safeStartAnvil = async (rpcUrl: string) => {
  const maxAttempts = 2;
  // attempts x attempDuration is still bounded by the server timeout in playwright.config.ts
  const attemptDuration = 30 * 1000; // 30 seconds
  let attempt = 1;

  while (attempt <= maxAttempts) {
    console.log(`Attempt ${attempt}/${maxAttempts} to start Anvil...`);

    try {
      const process = await unsafeStartAnvil(rpcUrl);
      let elapsedTime = 0;
      while (elapsedTime < attemptDuration) {
        const isProcessAlive = process.exitCode === null;
        if (!isProcessAlive) {
          console.error('Anvil process is not alive');
          break;
        }

        const isListening = await verifyAnvil();
        if (isListening) {
          console.log('Anvil is running');
          return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        elapsedTime += 1000;
      }
      console.error('Anvil is not running, restarting...');
      process.kill();
    } finally {
      attempt++;
    }
  }
  console.error(`Failed to start Anvil after ${maxAttempts} attempts`);
  return false;
};

// Main function to orchestrate the setup
const main = async () => {
  const rpcUrl = configService.get('RPC_URL');

  if (!rpcUrl) {
    process.exit(1);
  }

  const isStarted = await safeStartAnvil(rpcUrl);

  if (!isStarted) {
    console.error('❌ Could not start Anvil.');
    process.exit(1);
  }

  // Initialize account from mnemonic
  const account = mnemonicToAccount(configService.get('WALLET_SECRET_PHRASE'));

  // Create a public client connected to the Anvil node
  const client = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(`http://${ANVIL_HOST}:${ANVIL_PORT}`),
  });

  // Set default balance for the account
  await client.setBalance({
    address: account.address,
    value: 100n * 10n ** 18n, // 100 ETH
  });
  console.log('Set eth');
  // Function to set ERC-20 token balance
  const setErc20Balance = async (
    tokenAddress: `0x${string}`,
    mappingSlot: bigint,
    balance: bigint,
  ) => {
    // Calculate storage slot for the account balance
    const slot = keccak256(
      encodeAbiParameters(
        [{ type: 'address' }, { type: 'uint256' }],
        [account.address, mappingSlot],
      ),
    );

    // Set the storage at the calculated slot
    await client.setStorageAt({
      address: tokenAddress,
      index: slot, // Corrected property name
      value: encodeAbiParameters([{ type: 'uint256' }], [balance]),
    });
  };
  console.log('Set stake');
  // Set balances for ERC-20 tokens
  await setErc20Balance(
    ETHEREUM_WIDGET_CONFIG.stakeContract as `0x${string}`,
    0n,
    100n * 10n ** 18n, // 100 tokens
  );
  console.log('Set wrap');
  await setErc20Balance(
    ETHEREUM_WIDGET_CONFIG.wrapContract as `0x${string}`,
    0n,
    100n * 10n ** 18n, // 100 tokens
  );
  console.log('Anvil started');
  // Keep the script running
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise(() => {});
};

void main();
