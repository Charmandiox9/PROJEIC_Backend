import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectMetrics } from '../project-metrics/entities/project-metric.entity';
import { ProjectRoleGuard } from 'src/auth/guards/project-role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ProjectRole } from '@prisma/client';

@Resolver(() => Task)
@UseGuards(GqlAuthGuard, ProjectRoleGuard)
export class TasksResolver {
  constructor(private readonly tasksService: TasksService) {}

  @Mutation(() => Task)
  @Roles(ProjectRole.LEADER)
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

  @Roles(ProjectRole.LEADER)
  @Mutation(() => Task)
  removeTask(@Args('id') id: string, @CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.tasksService.remove(id, userId);
  }

  @Query(() => [Task], { name: 'tasksByProject' })
  findAllByProject(
    @Args('projectId') projectId: string,
    @Args('sprintId', { nullable: true }) sprintId?: string,
  ) {
    return this.tasksService.findAllByProject(projectId, sprintId);
  }

  @Query(() => ProjectMetrics, { name: 'projectMetrics' })
  getMetrics(@Args('projectId') projectId: string) {
    return this.tasksService.getProjectMetrics(projectId);
  }

  @Query(() => [Task], { name: 'pendingTasksByUserId' })
  findAllByUserId(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.tasksService.getAllTasksPendingByUserId(userId);
  }
}
