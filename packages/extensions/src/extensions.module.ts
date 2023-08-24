import { Module } from '@nestjs/common';
import { ExtensionService } from './extension.service';

@Module({
  controllers: [],
  providers: [ExtensionService],
  exports: [ExtensionService],
  imports: [],
})
export class ExtensionsModule {}
