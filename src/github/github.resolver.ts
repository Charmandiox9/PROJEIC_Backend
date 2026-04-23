import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { GithubService } from './github.service';
import {
  GithubCommitHistory,
  WorkflowRun,
  GithubActionResponse,
  Artifact,
  PullRequest,
  Deployment,
  SecurityAlert,
} from './entities/github.entity';

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

  @Query(() => [WorkflowRun], { name: 'getWorkflowRuns' })
  async getWorkflowRuns(
    @Args('token') token: string,
    @Args('owner') owner: string,
    @Args('repo') repo: string,
  ) {
    return this.githubService.getWorkflowRuns(token, owner, repo);
  }

  @Mutation(() => GithubActionResponse, { name: 'dispatchWorkflow' })
  async dispatchWorkflow(
    @Args('token') token: string,
    @Args('owner') owner: string,
    @Args('repo') repo: string,
    @Args('workflowId') workflowId: string,
    @Args('ref') ref: string,
  ) {
    return this.githubService.dispatchWorkflow(
      token,
      owner,
      repo,
      workflowId,
      ref,
    );
  }

  @Query(() => [Artifact], { name: 'getArtifacts' })
  async getArtifacts(
    @Args('token') token: string,
    @Args('owner') owner: string,
    @Args('repo') repo: string,
  ) {
    return this.githubService.getArtifacts(token, owner, repo);
  }

  @Query(() => [PullRequest], { name: 'getPullRequests' })
  async getPullRequests(
    @Args('token') token: string,
    @Args('owner') owner: string,
    @Args('repo') repo: string,
  ) {
    return this.githubService.getPullRequests(token, owner, repo);
  }

  @Query(() => [Deployment], { name: 'getDeployments' })
  async getDeployments(
    @Args('token') token: string,
    @Args('owner') owner: string,
    @Args('repo') repo: string,
  ) {
    return this.githubService.getDeployments(token, owner, repo);
  }

  @Query(() => [SecurityAlert], { name: 'getSecurityAlerts' })
  async getSecurityAlerts(
    @Args('token') token: string,
    @Args('owner') owner: string,
    @Args('repo') repo: string,
  ) {
    return this.githubService.getSecurityAlerts(token, owner, repo);
  }
}
