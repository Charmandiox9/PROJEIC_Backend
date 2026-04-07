import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import {
  TaskStatus,
  TaskPriority,
  ActivityAction,
  ActivityEntity,
} from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskInput: CreateTaskInput) {
    const initialStatus = createTaskInput.expectedResultId ? 'TODO' : 'BACKLOG';

    const newTask = await this.prisma.task.create({
      data: {
        title: createTaskInput.title,
        projectId: createTaskInput.projectId,
        creatorId: createTaskInput.creatorId,
        description: createTaskInput.description,
        priority: (createTaskInput.priority as TaskPriority) || 'MEDIUM',

        expectedResultId: createTaskInput.expectedResultId,
        boardId: createTaskInput.boardId,
        sprintId: createTaskInput.sprintId,
        assigneeId: createTaskInput.assigneeId,

        dueDate: createTaskInput.dueDate,

        status: initialStatus,
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
    const oldTask = await this.prisma.task.findUnique({
      where: { id },
      include: { assignee: { select: { name: true } } },
    });

    if (!oldTask) throw new NotFoundException('Tarea no encontrada');

    const updateData: any = {};
    if (updateTaskInput.title !== undefined)
      updateData.title = updateTaskInput.title;
    if (updateTaskInput.description !== undefined)
      updateData.description = updateTaskInput.description;
    if (updateTaskInput.status !== undefined)
      updateData.status = updateTaskInput.status as TaskStatus;
    if (updateTaskInput.priority !== undefined)
      updateData.priority = updateTaskInput.priority as TaskPriority;
    if (updateTaskInput.position !== undefined)
      updateData.position = updateTaskInput.position;
    if (updateTaskInput.dueDate !== undefined)
      updateData.dueDate = updateTaskInput.dueDate;
    if (updateTaskInput.boardId !== undefined)
      updateData.boardId = updateTaskInput.boardId;
    if (updateTaskInput.sprintId !== undefined)
      updateData.sprintId = updateTaskInput.sprintId;
    if (updateTaskInput.assigneeId !== undefined)
      updateData.assigneeId = updateTaskInput.assigneeId;
    if (updateTaskInput.sprintId !== undefined)
      updateData.sprintId = updateTaskInput.sprintId;

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: { assignee: { select: { name: true } } },
    });

    const metaObj: any = { title: updatedTask.title };
    const changes: Record<string, { from: any; to: any }> = {};
    let hasChanges = false;
    let wasAssignedToSomeoneElse = false;

    if (
      updateTaskInput.title !== undefined &&
      updateTaskInput.title !== oldTask.title
    ) {
      changes.title = { from: oldTask.title, to: updateTaskInput.title };
      hasChanges = true;
    }
    if (
      updateTaskInput.description !== undefined &&
      updateTaskInput.description !== oldTask.description
    ) {
      changes.description = {
        from: oldTask.description || 'Sin descripción',
        to: updateTaskInput.description || 'Sin descripción',
      };
      hasChanges = true;
    }
    if (
      updateTaskInput.priority !== undefined &&
      updateTaskInput.priority !== oldTask.priority
    ) {
      changes.priority = {
        from: oldTask.priority,
        to: updateTaskInput.priority,
      };
      hasChanges = true;
    }
    if (
      updateTaskInput.dueDate !== undefined &&
      updateTaskInput.dueDate !== oldTask.dueDate
    ) {
      changes.dueDate = { from: oldTask.dueDate, to: updateTaskInput.dueDate };
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

    if (
      updateTaskInput.sprintId !== undefined &&
      updateTaskInput.sprintId !== oldTask.sprintId
    ) {
      metaObj.previousSprint = oldTask.sprintId;
      metaObj.newSprint = updateTaskInput.sprintId;
      hasChanges = true;
    }

    if (
      updateTaskInput.assigneeId !== undefined &&
      updateTaskInput.assigneeId !== oldTask.assigneeId
    ) {
      changes.assignee = {
        from: oldTask.assignee?.name || 'Nadie',
        to: updatedTask.assignee?.name || 'Nadie',
      };
      hasChanges = true;
      wasAssignedToSomeoneElse = true;
    }

    if (Object.keys(changes).length > 0) {
      metaObj.changes = changes;
    }

    if (hasChanges) {
      await this.prisma.activityLog.create({
        data: {
          projectId: updatedTask.projectId,
          userId: userId,
          action: wasAssignedToSomeoneElse
            ? ActivityAction.ASSIGNED
            : ActivityAction.UPDATED,
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

  async findAllByProject(projectId: string, sprintId?: string) {
    return this.prisma.task.findMany({
      where: {
        projectId,
        sprintId: sprintId === 'backlog' ? null : sprintId,
      },
      orderBy: { position: 'asc' },
    });
  }

  async getAllTasksPendingByUserId(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId, status: { not: TaskStatus.DONE } },
      orderBy: { position: 'asc' },
    });
  }

  async getProjectMetrics(projectId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const [
        totalTasks,
        completedTasks,
        inReviewTasks,
        overdueTasksList,
        activityLast7Days,
        boards,
        tasksPerBoard,
      ] = await Promise.all([
        this.prisma.task.count({ where: { projectId } }),

        this.prisma.task.count({
          where: { projectId, status: TaskStatus.DONE },
        }),
        this.prisma.task.count({
          where: { projectId, status: TaskStatus.IN_REVIEW },
        }),

        this.prisma.task.findMany({
          where: {
            projectId,
            dueDate: { lt: today },
            status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        }),

        this.prisma.activityLog.count({
          where: { projectId, createdAt: { gte: sevenDaysAgo } },
        }),

        this.prisma.board.findMany({
          where: { projectId },
          orderBy: { position: 'asc' },
        }),

        this.prisma.task.groupBy({
          by: ['boardId'],
          where: { projectId, boardId: { not: null } },
          _count: { id: true },
        }),
      ]);

      const tasksByColumn = boards.map((board) => {
        const match = tasksPerBoard.find((t) => t.boardId === board.id);
        return {
          boardId: board.id,
          name: board.name,
          color: board.color,
          count: match ? match._count.id : 0,
        };
      });

      return {
        totalTasks,
        completedTasks,
        overdueTasksCount: overdueTasksList.length,
        inReviewTasks,
        activityLast7Days,
        tasksByColumn,
        overdueTasksList,
      };
    } catch (error) {
      console.error('🔥 ERROR EN PRISMA (getProjectMetrics):', error);
      throw error;
    }
  }
}
