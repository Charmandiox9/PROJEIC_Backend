import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BoardsService } from './boards.service';
import { Board } from './entities/board.entity';
import { CreateBoardInput } from './dto/create-board.input';
import { UpdateBoardInput } from './dto/update-board.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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

  @Mutation(() => Board)
  removeBoard(@Args('id') id: string, @CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.boardsService.remove(id, userId);
  }
}
