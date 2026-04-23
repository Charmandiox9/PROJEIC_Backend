import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { UploadsResolver } from './storage.resolver';

@Global()
@Module({
  providers: [StorageService, UploadsResolver],
  exports: [StorageService, UploadsResolver],
})
export class StorageModule {}