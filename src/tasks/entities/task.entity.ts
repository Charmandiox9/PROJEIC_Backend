import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Task {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

  @Field()
  projectId: string;

  @Field()
  creatorId: string;

  @Field({ nullable: true })
  expectedResultId?: string;

  @Field()
  createdAt: Date;
}
