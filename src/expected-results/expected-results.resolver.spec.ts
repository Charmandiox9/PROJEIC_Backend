import { Test, TestingModule } from '@nestjs/testing';
import { ExpectedResultsResolver } from './expected-results.resolver';

describe('ExpectedResultsResolver', () => {
  let resolver: ExpectedResultsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpectedResultsResolver],
    }).compile();

    resolver = module.get<ExpectedResultsResolver>(ExpectedResultsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
