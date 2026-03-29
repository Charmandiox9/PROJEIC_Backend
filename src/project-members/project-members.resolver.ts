import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { ProjectMembersService } from './project-members.service';
import { ProjectMemberEntity } from '../projects/entities/project.entity'; // Asegúrate de ajustar la ruta
import { AddProjectMemberInput } from './dto/add-member.input';
import { UpdateProjectMemberInput } from './dto/update-member.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(GqlAuthGuard)
@Resolver(() => ProjectMemberEntity)
export class ProjectMembersResolver {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @Mutation(() => ProjectMemberEntity)
  addProjectMember(
    @Args('input') input: AddProjectMemberInput,
    @CurrentUser() user: any,
  ) {
    return this.projectMembersService.addMember(input, user.userId);
  }

  @Mutation(() => ProjectMemberEntity)
  updateProjectMemberRole(
    @Args('input') input: UpdateProjectMemberInput,
    @CurrentUser() user: any,
  ) {
    return this.projectMembersService.updateRole(input, user.userId);
  }

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
}
