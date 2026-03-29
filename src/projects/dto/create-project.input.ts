import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsHexColor,
  MaxLength,
  MinLength,
} from 'class-validator';

// Importar desde common/enums garantiza que registerEnumType() ya corrió
import {
  ProjectStatus,
  ProjectMethodology,
} from '../../common/enums/project.enums';

@InputType({ description: 'Data required to create a new project' })
export class CreateProjectInput {
  @Field({ description: 'Project display name (3–100 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional description (max 500 chars)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

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
}
