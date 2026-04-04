import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  create(createTaskInput: CreateTaskInput) {
    return this.prisma.task.create({
      data: {
        title: createTaskInput.title,
        projectId: createTaskInput.projectId,
        creatorId: createTaskInput.creatorId,
        expectedResultId: createTaskInput.expectedResultId,
        status: 'TODO',
      },
    });
  }

  update(id: string, updateTaskInput: UpdateTaskInput) {
    return this.prisma.task.update({
      where: { id },
      data: {
        title: updateTaskInput.title,
        status: updateTaskInput.status as TaskStatus,
      },
    });
  }

  remove(id: string) {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
