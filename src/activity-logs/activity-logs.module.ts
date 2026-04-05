import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsResolver } from './activity-logs.resolver';

@Module({
  providers: [ActivityLogsResolver, ActivityLogsService],
})
export class ActivityLogsModule {}
