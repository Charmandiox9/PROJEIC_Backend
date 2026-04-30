import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsHexColor,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProjectStatus,
  ProjectMethodology,
  ProjectMode,
} from 'src/common/enums/project.enums';
import { RepositoryInput } from '../entities/repository.input';
import { LocalizedStringDto } from '../../common/dto/localized-string.dto';

@InputType({
  description: 'Data to update an existing project (all fields optional)',
})
export class UpdateProjectInput {
  @Field(() => ID, { description: 'ID of the project to update' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => LocalizedStringDto, {
    nullable: true,
    description: 'Display name of the project',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name?: LocalizedStringDto;

  @Field(() => LocalizedStringDto, {
    nullable: true,
    description: 'Optional description',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @Field(() => ProjectStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @Field(() => ProjectMethodology, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectMethodology)
  methodology?: ProjectMethodology;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isInstitutional?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  assignMeAsLeader?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @Field(() => ProjectMode, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectMode)
  mode?: ProjectMode;

  @Field(() => [RepositoryInput], { nullable: true })
  @IsOptional()
  repositories?: RepositoryInput[];
}
