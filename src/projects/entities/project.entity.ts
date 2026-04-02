import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  ProjectStatus,
  ProjectMethodology,
  MemberStatus,
} from '@prisma/client';
import '../../common/enums/project.enums';

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
}
