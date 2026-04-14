import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BoardsService } from './boards.service';
import { Board } from './entities/board.entity';
import { CreateBoardInput } from './dto/create-board.input';
import { UpdateBoardInput } from './dto/update-board.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { ProjectRoleGuard } from 'src/auth/guards/project-role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ProjectRole } from '@prisma/client';

@UseGuards(GqlAuthGuard, ProjectRoleGuard)
@Resolver(() => Board)
export class BoardsResolver {
  constructor(private readonly boardsService: BoardsService) {}

  @Mutation(() => [Board])
  createDefaultBoards(
    @Args('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.boardsService.createDefaultBoards(projectId, userId);
  }

  @Roles(ProjectRole.LEADER)
  @Mutation(() => Board)
  createBoard(
    @Args('createBoardInput') createBoardInput: CreateBoardInput,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.boardsService.create(createBoardInput, userId);
  }

  @Query(() => [Board], { name: 'boardsByProject' })
  findAllByProject(@Args('projectId') projectId: string) {
    return this.boardsService.findAllByProject(projectId);
  }

  @Roles(ProjectRole.LEADER)
  @Mutation(() => Board)
  updateBoard(
    @Args('updateBoardInput') updateBoardInput: UpdateBoardInput,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.boardsService.update(
      updateBoardInput.id,
      updateBoardInput,
      userId,
    );
  }

  @Roles(ProjectRole.LEADER)
  @Mutation(() => Board)
  removeBoard(@Args('id') id: string, @CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.boardsService.remove(id, userId);
  }
}
