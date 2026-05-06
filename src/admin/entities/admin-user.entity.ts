import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class AdminUser {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() email: string;
  @Field({ nullable: true }) avatarUrl?: string;
  @Field({ nullable: true }) isActive?: boolean;
  @Field({ nullable: true }) lastLogin?: string;
  @Field({ nullable: true }) blockedUntil?: string;
  @Field() isAdmin: boolean;
  @Field() createdAt: string;
  @Field({ nullable: true }) updatedAt?: string;
}

@ObjectType()
export class PaginatedUsers {
  @Field(() => [AdminUser]) items: AdminUser[];
  @Field() totalCount: number;
}
