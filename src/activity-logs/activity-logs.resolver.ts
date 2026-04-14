import {
  Resolver,
  Query,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLog } from './entities/activity-log.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => ActivityLog)
@UseGuards(GqlAuthGuard)
export class ActivityLogsResolver {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Query(() => [ActivityLog], { name: 'activityLogsByProject' })
  findByProject(@Args('projectId', { type: () => String }) projectId: string) {
    return this.activityLogsService.findByProject(projectId);
  }

  @Query(() => Int, { name: 'myWeeklyActivityPoints' })
  myWeeklyActivityPoints(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.activityLogsService.myWeeklyActivityPoints(userId);
  }

  @Query(() => [ActivityLog], { name: 'myRecentFeed' })
  myRecentFeed(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.activityLogsService.myRecentFeed(userId);
  }

  @ResolveField(() => String, { nullable: true })
  meta(@Parent() log: any): string | null {
    if (!log.meta) return null;
    return typeof log.meta === 'string' ? log.meta : JSON.stringify(log.meta);
  }
}
