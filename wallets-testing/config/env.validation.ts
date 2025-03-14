import { z } from 'zod';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { ConsoleLogger } from '@nestjs/common';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const EnvironmentSchema = z.object({
  RPC_URL: z.string().url({ message: 'RPC_URL must be a valid URL' }),
  WALLET_SECRET_PHRASE: z
    .string()
    .min(1, 'WALLET_SECRET_PHRASE cannot be empty'),
  WALLET_PASSWORD: z.string().min(1, 'WALLET_PASSWORD cannot be empty'),
});

export type EnvironmentVariables = z.infer<typeof EnvironmentSchema>;

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const parsedConfig = EnvironmentSchema.safeParse(config);

  if (!parsedConfig.success) {
    new ConsoleLogger('env validation').error(parsedConfig.error.format());
    process.exit(1);
  }

  return parsedConfig.data;
}
