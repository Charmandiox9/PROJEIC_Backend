import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMembersResolver } from './project-members.resolver';
import { ProjectMembersService } from './project-members.service';

describe('ProjectMembersResolver', () => {
  let resolver: ProjectMembersResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectMembersResolver, ProjectMembersService],
    }).compile();

    resolver = module.get<ProjectMembersResolver>(ProjectMembersResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
