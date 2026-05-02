import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksResolver } from './tasks.resolver';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ProjectMetricsModule } from 'src/project-metrics/project-metrics.module';

@Module({
  imports: [NotificationsModule, ProjectMetricsModule],
  providers: [TasksResolver, TasksService],
})
export class TasksModule {}
