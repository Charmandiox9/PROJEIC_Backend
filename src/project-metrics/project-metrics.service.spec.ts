import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMetricsService } from './project-metrics.service';

describe('ProjectMetricsService', () => {
  let service: ProjectMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectMetricsService],
    }).compile();

    service = module.get<ProjectMetricsService>(ProjectMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
