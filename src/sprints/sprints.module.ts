import { Module } from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { SprintsResolver } from './sprints.resolver';

@Module({
  providers: [SprintsResolver, SprintsService],
})
export class SprintsModule {}
