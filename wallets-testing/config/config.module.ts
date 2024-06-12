import { ConfigModule as ConfigModuleSource } from '@nestjs/config';
import { ConfigService } from './config.service';
import { validate } from './env.validation';
import { DynamicModule } from '@nestjs/common';

export const ConfigModule: DynamicModule = ConfigModuleSource.forRoot({
  validate,
  isGlobal: true,
  cache: true,
});

ConfigModule.providers.push(ConfigService);
ConfigModule.exports.push(ConfigService);
