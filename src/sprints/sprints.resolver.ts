import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SprintsService } from './sprints.service';
import { Sprint } from './entities/sprint.entity';
import { CreateSprintInput } from './dto/create-sprint.input';
import { BurndownDataPoint } from './entities/burndown-data-point.entity';

@Resolver(() => Sprint)
@UseGuards(GqlAuthGuard)
export class SprintsResolver {
  constructor(private readonly sprintsService: SprintsService) {}

  @Mutation(() => Sprint)
  createSprint(
    @Args('input') input: CreateSprintInput,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.sprintsService.create(input, userId);
  }

  @Query(() => [Sprint], { name: 'sprintsByProject' })
  findAllByProject(@Args('projectId') projectId: string) {
    return this.sprintsService.findAllByProject(projectId);
  }

  @Mutation(() => Sprint)
  startSprint(
    @Args('id') id: string,
    @Args('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.sprintsService.startSprint(id, projectId, userId);
  }

  @Mutation(() => Sprint)
  completeSprint(@Args('id') id: string, @CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.sprintsService.completeSprint(id, userId);
  }

  @Query(() => [BurndownDataPoint], { name: 'sprintBurndown' })
  getSprintBurndown(@Args('sprintId') sprintId: string) {
    return this.sprintsService.getSprintBurndown(sprintId);
  }
}
