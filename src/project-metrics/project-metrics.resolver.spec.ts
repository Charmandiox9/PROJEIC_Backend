import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMetricsResolver } from './project-metrics.resolver';
import { ProjectMetricsService } from './project-metrics.service';

describe('ProjectMetricsResolver', () => {
  let resolver: ProjectMetricsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectMetricsResolver, ProjectMetricsService],
    }).compile();

    resolver = module.get<ProjectMetricsResolver>(ProjectMetricsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
