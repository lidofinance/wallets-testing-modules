import { validate } from './env.validation';
import { EnvironmentVariables } from './env.validation';

class ConfigService {
  private env: EnvironmentVariables;

  constructor() {
    this.env = validate(process.env);
  }

  get<K extends keyof EnvironmentVariables>(key: K): EnvironmentVariables[K] {
    return this.env[key];
  }
}

export const configService = new ConfigService();
