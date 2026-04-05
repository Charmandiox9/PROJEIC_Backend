import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private readonly tasksService: TasksService) {}

  @Mutation(() => Task)
  createTask(@Args('createTaskInput') createTaskInput: CreateTaskInput) {
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
}
