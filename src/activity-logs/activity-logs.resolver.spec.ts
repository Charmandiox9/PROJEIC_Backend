import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsResolver } from './activity-logs.resolver';
import { ActivityLogsService } from './activity-logs.service';

describe('ActivityLogsResolver', () => {
  let resolver: ActivityLogsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityLogsResolver, ActivityLogsService],
    }).compile();

    resolver = module.get<ActivityLogsResolver>(ActivityLogsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
