import { Test, TestingModule } from '@nestjs/testing';
import { BoardsResolver } from './boards.resolver';
import { BoardsService } from './boards.service';

describe('BoardsResolver', () => {
  let resolver: BoardsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoardsResolver, BoardsService],
    }).compile();

    resolver = module.get<BoardsResolver>(BoardsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
