import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Board {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Int)
  position: number;

  @Field({ nullable: true })
  color?: string;

  @Field(() => Int, { nullable: true })
  wipLimit?: number;

  @Field()
  projectId: string;
}
