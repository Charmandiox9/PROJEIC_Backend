import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { TaskStatus, ActivityAction, ActivityEntity } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskInput: CreateTaskInput) {
    const newTask = await this.prisma.task.create({
      data: {
        title: createTaskInput.title,
        projectId: createTaskInput.projectId,
        creatorId: createTaskInput.creatorId,
        expectedResultId: createTaskInput.expectedResultId,
        status: 'TODO',
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: newTask.projectId,
        userId: newTask.creatorId,
        action: ActivityAction.CREATED,
        entity: ActivityEntity.TASK,
        entityId: newTask.id,
        meta: { title: newTask.title },
      },
    });

    return newTask;
  }

  async update(id: string, updateTaskInput: UpdateTaskInput, userId: string) {
    const oldTask = await this.prisma.task.findUnique({ where: { id } });
    if (!oldTask) throw new NotFoundException('Tarea no encontrada');

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        title: updateTaskInput.title,
        status: updateTaskInput.status as TaskStatus,
      },
    });

    const metaObj: any = { title: updatedTask.title };
    const changes: Record<string, { from: any; to: any }> = {};
    let hasChanges = false;

    if (
      updateTaskInput.title !== undefined &&
      updateTaskInput.title !== oldTask.title
    ) {
      changes.title = { from: oldTask.title, to: updateTaskInput.title };
      hasChanges = true;
    }

    if (
      updateTaskInput.status !== undefined &&
      updateTaskInput.status !== oldTask.status
    ) {
      metaObj.previousStatus = oldTask.status;
      metaObj.newStatus = updateTaskInput.status;
      hasChanges = true;
    }

    if (Object.keys(changes).length > 0) {
      metaObj.changes = changes;
    }

    if (hasChanges) {
      await this.prisma.activityLog.create({
        data: {
          projectId: updatedTask.projectId,
          userId: userId,
          action: ActivityAction.UPDATED,
          entity: ActivityEntity.TASK,
          entityId: updatedTask.id,
          meta: metaObj,
        },
      });
    }

    return updatedTask;
  }

  async remove(id: string, userId: string) {
    const taskToDelete = await this.prisma.task.findUnique({ where: { id } });
    if (!taskToDelete) throw new NotFoundException('Tarea no encontrada');

    await this.prisma.task.delete({
      where: { id },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: taskToDelete.projectId,
        userId: userId,
        action: ActivityAction.DELETED,
        entity: ActivityEntity.TASK,
        entityId: id,
        meta: { title: taskToDelete.title },
      },
    });

    return taskToDelete;
  }
}
