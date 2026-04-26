import { InputType, Field, ID } from '@nestjs/graphql';
import { ProjectRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class UpdateProjectMemberInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @Field(() => ProjectRole)
  @IsEnum(ProjectRole)
  role: ProjectRole;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsNotEmpty()
  projectId?: string;
}
