import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

import {
  ProjectStatus,
  ProjectMethodology,
} from '../../common/enums/project.enums';

@InputType({ description: 'Filters and pagination for listing projects' })
export class ProjectsFilterInput {
  @Field(() => ProjectStatus, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @Field(() => ProjectMethodology, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectMethodology)
  methodology?: ProjectMethodology;

  @Field({ nullable: true, description: 'Filter by visibility' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @Field({
    nullable: true,
    defaultValue: false,
    description: 'Include archived projects',
  })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean;

  @Field({ nullable: true, description: 'Search by name (case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 20,
    description: 'Max results (1–100)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Offset for pagination',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;
}
