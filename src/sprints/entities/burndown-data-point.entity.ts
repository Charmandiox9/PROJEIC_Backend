import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class BurndownDataPoint {
  @Field()
  date: string;

  @Field()
  dayLabel: string;

  @Field(() => Float, { nullable: true })
  ideal: number | null;

  @Field(() => Float, { nullable: true })
  real: number | null;
}
