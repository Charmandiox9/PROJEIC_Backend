import { ObjectType, Field, ID } from '@nestjs/graphql';
import { SprintStatus } from '@prisma/client';

@ObjectType()
export class Sprint {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  goal?: string;

  @Field()
  status: SprintStatus;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field()
  projectId: string;
}
