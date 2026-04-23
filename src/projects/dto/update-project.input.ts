import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { CreateProjectInput } from './create-project.input';
import { ProjectMode } from 'src/common/enums/project.enums';

@InputType({
  description: 'Data to update an existing project (all fields optional)',
})
export class UpdateProjectInput extends PartialType(CreateProjectInput) {
  @Field(() => ID, { description: 'ID of the project to update' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => String, { nullable: true })
  @IsString()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  color?: string;

  @Field(() => Boolean, { nullable: true })
  isPublic?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  assignMeAsLeader?: boolean;

  @Field(() => Boolean, { nullable: true })
  isInstitutional?: boolean;

  @Field(() => String, { nullable: true })
  subjectId?: string;

  @Field(() => ProjectMode, { nullable: true })
  @IsEnum(ProjectMode)
  @IsOptional()
  mode?: ProjectMode;
}
