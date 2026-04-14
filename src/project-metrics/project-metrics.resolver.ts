import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ProjectMetricsService } from './project-metrics.service';
import { ProjectMetrics } from './entities/project-metric.entity';

@Resolver(() => ProjectMetrics)
export class ProjectMetricsResolver {
  constructor(private readonly projectMetricsService: ProjectMetricsService) {}
}
