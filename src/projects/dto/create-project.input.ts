import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsHexColor,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import {
  ProjectStatus,
  ProjectMethodology,
  ProjectMode,
} from '../../common/enums/project.enums';
import { RepositoryInput } from '../entities/repository.input';
import { LocalizedStringDto } from '../../common/dto/localized-string.dto';

@InputType({ description: 'Data required to create a new project' })
export class CreateProjectInput {
  @Field({ description: 'Project display name (3–100 chars)' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  name: LocalizedStringDto;

  @Field(() => LocalizedStringDto, {
    nullable: true,
    description: 'Optional description (max 500 chars)',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  @Field({
    nullable: true,
    defaultValue: '#3B82F6',
    description: 'Hex color (e.g. #3B82F6)',
  })
  @IsOptional()
  @IsHexColor()
  color?: string;

  @Field(() => ProjectStatus, {
    nullable: true,
    defaultValue: ProjectStatus.ACTIVE,
    description: 'Initial status (defaults to ACTIVE)',
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @Field(() => ProjectMethodology, {
    nullable: true,
    defaultValue: ProjectMethodology.KANBAN,
    description: 'Methodology (defaults to KANBAN)',
  })
  @IsOptional()
  @IsEnum(ProjectMethodology)
  methodology?: ProjectMethodology;

  @Field({
    nullable: true,
    defaultValue: false,
    description: 'Make project visible to everyone',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isInstitutional?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  professorId?: string;

  @Field(() => ProjectMode, { nullable: true })
  @IsEnum(ProjectMode)
  @IsOptional()
  mode?: ProjectMode;

  @Field(() => [RepositoryInput], { nullable: true })
  @IsOptional()
  repositories?: RepositoryInput[];
}
