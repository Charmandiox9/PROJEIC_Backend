import { ObjectType, Field, Int } from '@nestjs/graphql';

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