import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../auth/entities/auth.entity';

@ObjectType()
export class ActivityLog {
  @Field(() => ID)
  id: string;

  @Field()
  action: string;

  @Field()
  entity: string;

  @Field()
  entityId: string;

  @Field({ nullable: true })
  meta?: string;

  @Field()
  createdAt: Date;

  @Field()
  projectId: string;

  @Field(() => User)
  user: User;
}
