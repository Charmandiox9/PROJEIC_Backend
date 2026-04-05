import { Resolver, Query, Args } from '@nestjs/graphql';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLog } from './entities/activity-log.entity';

@Resolver(() => ActivityLog)
export class ActivityLogsResolver {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Query(() => [ActivityLog], { name: 'activityLogsByProject' })
  findByProject(@Args('projectId', { type: () => String }) projectId: string) {
    return this.activityLogsService.findByProject(projectId);
  }
}
