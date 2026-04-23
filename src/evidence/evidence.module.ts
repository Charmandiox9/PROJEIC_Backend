import { Module } from '@nestjs/common';
import { EvidenceResolver } from './evidence.resolver';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  providers: [EvidenceResolver],
})
export class EvidenceModule {}
