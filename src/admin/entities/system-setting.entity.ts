import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SystemSettingEntity {
  @Field(() => ID) id: string;
  @Field() activePeriod: string;
  @Field() allowNewProjects: boolean;
  @Field() maintenanceMode: boolean;
  @Field() updatedAt: Date;
}
