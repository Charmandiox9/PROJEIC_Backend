import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { MemberStatus } from '@prisma/client';
import { PublicUser } from 'src/projects/entities/project.entity';

registerEnumType(MemberStatus, { name: 'MemberStatus' });

@ObjectType()
export class ProjectMember {
  @Field(() => ID)
  id: string;

  @Field()
  role: string;

  @Field(() => MemberStatus)
  status: MemberStatus;

  @Field(() => PublicUser)
  user: PublicUser;

  @Field(() => Date)
  joinedAt: Date;
}
