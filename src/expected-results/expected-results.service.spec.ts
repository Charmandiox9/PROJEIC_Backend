import { Test, TestingModule } from '@nestjs/testing';
import { ExpectedResultsService } from './expected-results.service';

describe('ExpectedResultsService', () => {
  let service: ExpectedResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpectedResultsService],
    }).compile();

    service = module.get<ExpectedResultsService>(ExpectedResultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
