export const ANVIL_DEFAULT_PORT = 8545;
export const ANVIL_DEFAULT_DERIVATION_PATH = "m/44'/60'/2020'/0/0";
export const ANVIL_LOG_DIR = 'anvil-log/';
export const ANVIL_IMPERSONATE_ETH_BALANCE = '0x3635C9ADC5DEA00000'; // ~1000 ETH

export const ANVIL_FATAL_PATTERNS: Array<{ pattern: RegExp; reason: string }> =
  [
    { pattern: /Invalid URL/i, reason: 'Invalid fork RPC URL' },
    { pattern: /error binding/i, reason: 'Port already in use' },
    {
      pattern: /No such file or directory.*anvil/i,
      reason: 'Anvil binary not found',
    },
  ];

export const ANVIL_RESTART_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
}> = [
  { pattern: /connection refused/i, reason: 'Fork RPC URL is unreachable' },
  {
    pattern: /rate limit|429|too many requests/i,
    reason: 'Fork RPC URL is rate-limited',
  },
  { pattern: /timeout|timed out/i, reason: 'Fork RPC URL timed out' },
  { pattern: /failed to get block/i, reason: 'Fork block fetch failed' },
];
