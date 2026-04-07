import { Module } from '@nestjs/common';
import { ProjectMetricsService } from './project-metrics.service';
import { ProjectMetricsResolver } from './project-metrics.resolver';

@Module({
  providers: [ProjectMetricsResolver, ProjectMetricsService],
})
export class ProjectMetricsModule {}
