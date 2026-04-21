import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  ProjectStatus,
  ProjectMethodology,
  MemberStatus,
  ProjectRole,
  ProjectMode,
} from '@prisma/client';
import '../../common/enums/project.enums';
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { SubjectEntity } from '../../subjects/entities/subject.entity';

registerEnumType(MemberStatus, { name: 'MemberStatus' });

// ─── Sub-types ────────────────────────────────────────────────────────────────

@ObjectType()
export class PublicUser {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  avatarUrl: string | null;
}

@ObjectType()
export class ProjectMemberEntity {
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

// ─── Main entity ──────────────────────────────────────────────────────────────

@ObjectType({ description: 'Represents a project in the system' })
export class ProjectEntity {
  @Field(() => ID, { description: 'Unique identifier (cuid)' })
  id: string;

  @Field({ description: 'Display name of the project' })
  name: string;

  @Field(() => String, {
    nullable: true,
    description: 'Optional long description',
  })
  description: string | null;

  @Field({ description: 'Hex color used for UI theming (e.g. #3B82F6)' })
  color: string;

  @Field(() => ProjectStatus, { description: 'Current lifecycle status' })
  status: ProjectStatus;

  @Field(() => ProjectMethodology, {
    description: 'Development methodology in use',
  })
  methodology: ProjectMethodology;

  @Field({ description: 'Whether the project is visible to all users' })
  isPublic: boolean;

  @Field({
    description: 'Soft-delete flag; archived projects are hidden by default',
  })
  isArchived: boolean;

  @Field({ description: 'ISO timestamp of creation' })
  createdAt: Date;

  @Field({ description: 'ISO timestamp of last update' })
  updatedAt: Date;

  @Field(() => [ProjectMemberEntity], {
    nullable: true,
    description:
      'Members of the project (only included when explicitly requested)',
  })
  members?: ProjectMemberEntity[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isInstitutional?: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'ID of the subject area this project belongs to',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @Field(() => SubjectEntity, { nullable: true })
  subject?: SubjectEntity;

  @Field(() => ProjectRole, { nullable: true })
  @IsOptional()
  @IsEnum(ProjectRole)
  myRole?: ProjectRole;

  @Field(() => ProjectMode, { nullable: true })
  @IsEnum(ProjectMode)
  @IsOptional()
  mode?: ProjectMode;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  githubOwner?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  githubRepo?: string;
}
