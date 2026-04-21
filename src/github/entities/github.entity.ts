import { ObjectType, Field, Int, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class CommitAuthorUser {
  @Field()
  login: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}

@ObjectType()
export class CommitAuthor {
  @Field()
  name: string;

  @Field(() => CommitAuthorUser, { nullable: true })
  user?: CommitAuthorUser;
}

@ObjectType()
export class CommitNode {
  @Field()
  oid: string;

  @Field()
  message: string;

  @Field(() => Int)
  additions: number;

  @Field(() => Int)
  deletions: number;

  @Field()
  committedDate: string;

  @Field(() => CommitAuthor)
  author: CommitAuthor;
}

@ObjectType()
export class CommitStats {
  @Field(() => Int)
  totalAdditions: number;

  @Field(() => Int)
  totalDeletions: number;
}

@ObjectType()
export class GithubCommitHistory {
  @Field(() => Int)
  totalCommits: number;

  @Field(() => CommitStats)
  stats: CommitStats;

  @Field(() => [CommitNode])
  commits: CommitNode[];
}

@ObjectType()
export class WorkflowRun {
  @Field(() => Float)
  id: number;

  @Field()
  status: string;

  @Field({ nullable: true })
  conclusion?: string;

  @Field()
  display_title: string;

  @Field()
  created_at: string;

  @Field()
  html_url: string;
}

@ObjectType()
export class Artifact {
  @Field(() => Float)
  id: number;

  @Field()
  name: string;

  @Field(() => Float)
  size_in_bytes: number;

  @Field()
  expired: boolean;

  @Field()
  created_at: string;
}

@ObjectType()
export class GithubActionResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;
}