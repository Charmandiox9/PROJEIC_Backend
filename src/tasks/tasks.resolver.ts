import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectMetrics } from '../project-metrics/entities/project-metric.entity';

@Resolver(() => Task)
@UseGuards(GqlAuthGuard)
export class TasksResolver {
  constructor(private readonly tasksService: TasksService) {}

  @Mutation(() => Task)
  createTask(
    @Args('createTaskInput') createTaskInput: CreateTaskInput,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    createTaskInput.creatorId = userId;
    return this.tasksService.create(createTaskInput);
  }

  @Mutation(() => Task)
  updateTask(
    @Args('updateTaskInput') updateTaskInput: UpdateTaskInput,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.tasksService.update(
      updateTaskInput.id,
      updateTaskInput,
      userId,
    );
  }

  @Mutation(() => Task)
  removeTask(@Args('id') id: string, @CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.tasksService.remove(id, userId);
  }

  @Query(() => [Task], { name: 'tasksByProject' })
  findAllByProject(@Args('projectId') projectId: string) {
    return this.tasksService.findAllByProject(projectId);
  }

  @Query(() => ProjectMetrics, { name: 'projectMetrics' })
  getMetrics(@Args('projectId') projectId: string) {
    return this.tasksService.getProjectMetrics(projectId);
  }
}
