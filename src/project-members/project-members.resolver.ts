import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { ProjectMembersService } from './project-members.service';
import { ProjectMemberEntity } from '../projects/entities/project.entity'; // Asegúrate de ajustar la ruta
import { AddProjectMemberInput } from './dto/add-member.input';
import { UpdateProjectMemberInput } from './dto/update-member.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ProjectRole } from '@prisma/client';
import { ProjectRoleGuard } from 'src/auth/guards/project-role.guard';
import { ProjectMember } from './entities/project-member.entity';

@UseGuards(GqlAuthGuard, ProjectRoleGuard)
@Resolver(() => ProjectMemberEntity)
export class ProjectMembersResolver {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @Mutation(() => ProjectMemberEntity)
  @Roles(ProjectRole.LEADER)
  addProjectMember(
    @Args('input') input: AddProjectMemberInput,
    @CurrentUser() user: any,
  ) {
    return this.projectMembersService.addMember(input, user.userId);
  }

  @Mutation(() => ProjectMemberEntity, { nullable: true })
  respondToInvitation(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('accept', { type: () => Boolean }) accept: boolean,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.projectMembersService.respondToInvitation(
      projectId,
      userId,
      accept,
    );
  }

  @Roles(ProjectRole.LEADER)
  @Mutation(() => ProjectMemberEntity)
  updateProjectMemberRole(
    @Args('input') input: UpdateProjectMemberInput,
    @CurrentUser() user: any,
  ) {
    return this.projectMembersService.updateRole(input, user.userId);
  }

  @Roles(ProjectRole.LEADER)
  @Mutation(() => Boolean)
  removeProjectMember(
    @Args('memberId', { type: () => ID }) memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectMembersService
      .removeMember(memberId, user.userId)
      .then(() => true)
      .catch(() => false);
  }

  @Mutation(() => ProjectMember)
  async redeemProjectInvitation(
    @Args('token') token: string,
    @CurrentUser() user: any,
  ) {
    return this.projectMembersService.redeemProjectInvitation(token, user.id);
  }
}
