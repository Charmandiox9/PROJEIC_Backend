import { ObjectType, Field, ID } from '@nestjs/graphql';
import { PublicUser } from '../../projects/entities/project.entity';

@ObjectType()
export class SubjectEntity {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  code?: string;

  @Field()
  period: string;

  @Field(() => [PublicUser], { nullable: true })
  professors?: PublicUser[];
}
