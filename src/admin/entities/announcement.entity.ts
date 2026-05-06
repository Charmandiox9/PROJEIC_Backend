import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class AnnouncementEntity {
  @Field(() => ID) id: string;
  @Field() title: string;
  @Field() message: string;
  @Field() type: string;
  @Field() isActive: boolean;
  @Field() createdAt: Date;
}
