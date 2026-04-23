import { Module } from '@nestjs/common';
import { ExpectedResultsService } from './expected-results.service';
import { ExpectedResultsResolver } from './expected-results.resolver';
import { EvidenceResolver } from '../evidence/evidence.resolver';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  providers: [
    ExpectedResultsService,
    ExpectedResultsResolver,
    EvidenceResolver,
  ],
})
export class ExpectedResultsModule {}
