import { Resolver, Query, Args } from '@nestjs/graphql';
import { GithubService } from './github.service';
import { GithubCommitHistory } from './entities/github.entity';

@Resolver()
export class GithubResolver {
  constructor(private readonly githubService: GithubService) {}

  @Query(() => GithubCommitHistory, { name: 'getGithubCommits' })
  async getGithubCommits(
    @Args('token') token: string,
    @Args('owner') owner: string,
    @Args('name') name: string,
    @Args('branch', { defaultValue: 'main' }) branch: string,
  ) {
    return this.githubService.getCommitHistory(token, owner, name, branch);
  }
}