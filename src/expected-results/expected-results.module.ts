import { Module } from '@nestjs/common';
import { ExpectedResultsService } from './expected-results.service';
import { ExpectedResultsResolver } from './expected-results.resolver';

@Module({
  providers: [ExpectedResultsService, ExpectedResultsResolver]
})
export class ExpectedResultsModule {}
