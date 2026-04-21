import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import {
  TaskStatus,
  TaskPriority,
  ActivityAction,
  ActivityEntity,
  NotificationType,
} from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createTaskInput: CreateTaskInput) {
    const initialStatus = createTaskInput.expectedResultId ? 'TODO' : 'BACKLOG';
    const { tags, ...taskData } = createTaskInput;

    const newTask = await this.prisma.task.create({
      data: {
        ...taskData,
        title: createTaskInput.title,
        projectId: createTaskInput.projectId,
        creatorId: createTaskInput.creatorId,
        description: createTaskInput.description,
        priority: (createTaskInput.priority as TaskPriority) || 'MEDIUM',

        expectedResultId: createTaskInput.expectedResultId,
        boardId: createTaskInput.boardId,
        sprintId: createTaskInput.sprintId,
        assigneeId: createTaskInput.assigneeId,

        startDate: createTaskInput.startDate,
        dueDate: createTaskInput.dueDate,

        status: initialStatus,
      },
    });

    if (tags && tags.length > 0) {
      await this.handleTaskTags(newTask.id, createTaskInput.projectId, tags);
    }

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

    const finalTask = await this.prisma.task.findUnique({
      where: { id: newTask.id },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!finalTask) return null;

    return {
      ...finalTask,
      tags: finalTask.tags.map((tt) => tt.tag.name),
    };
  }

  async update(id: string, updateTaskInput: UpdateTaskInput, userId: string) {
    const { tags, ...taskData } = updateTaskInput;

    const oldTask = await this.prisma.task.findUnique({
      where: { id },
      include: { assignee: { select: { name: true } } },
    });

    if (!oldTask) throw new NotFoundException('Tarea no encontrada');

    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: oldTask.projectId } },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException('No tienes acceso activo a este proyecto.');
    }

    const { role } = membership;

    if (role === 'EXTERNAL') {
      throw new ForbiddenException(
        'Los colaboradores externos no pueden editar ni mover tareas.',
      );
    }

    if (role === 'SUPERVISOR') {
      const isEditingDetails =
        taskData.title !== undefined ||
        taskData.description !== undefined ||
        taskData.priority !== undefined ||
        taskData.startDate !== undefined ||
        taskData.dueDate !== undefined;

      if (isEditingDetails) {
        throw new ForbiddenException(
          'Como supervisor, solo puedes revisar y cambiar el estado de las tareas, no editar su contenido.',
        );
      }
    }

    if (role === 'STUDENT') {
      if (oldTask.assigneeId !== userId && taskData.assigneeId !== userId) {
        throw new ForbiddenException(
          'Solo puedes actualizar o mover las tareas que tienes asignadas.',
        );
      }

      if (taskData.status !== undefined) {
        if (taskData.status === 'DONE') {
          throw new ForbiddenException(
            'Solo el PM (Líder) o Supervisor puede aprobar una tarea para pasarla a DONE.',
          );
        }
        if (taskData.status === 'BACKLOG' || taskData.status === 'CANCELLED') {
          throw new ForbiddenException(
            'No tienes permisos para cancelar tareas ni retrocederlas al Backlog.',
          );
        }
      }
    }

    const updateData: any = {};

    if (taskData.title !== undefined) updateData.title = taskData.title;
    if (taskData.description !== undefined)
      updateData.description = taskData.description;
    if (taskData.status !== undefined)
      updateData.status = taskData.status as TaskStatus;
    if (taskData.priority !== undefined)
      updateData.priority = taskData.priority as TaskPriority;
    if (taskData.position !== undefined)
      updateData.position = taskData.position;
    if (taskData.startDate !== undefined)
      updateData.startDate = taskData.startDate;
    if (taskData.dueDate !== undefined) updateData.dueDate = taskData.dueDate;

    if (taskData.boardId !== undefined) updateData.boardId = taskData.boardId;
    if (taskData.sprintId !== undefined)
      updateData.sprintId = taskData.sprintId;
    if (taskData.assigneeId !== undefined)
      updateData.assigneeId = taskData.assigneeId;

    if (
      taskData.boardId !== undefined &&
      taskData.boardId !== null &&
      taskData.boardId !== oldTask.boardId
    ) {
      const targetBoard = await this.prisma.board.findUnique({
        where: { id: taskData.boardId },
        include: { _count: { select: { tasks: true } } },
      });

      if (!targetBoard)
        throw new NotFoundException('Tablero destino no encontrado');

      if (
        targetBoard.wipLimit !== null &&
        targetBoard._count.tasks >= targetBoard.wipLimit
      ) {
        throw new BadRequestException(
          `Límite WIP excedido: La columna "${targetBoard.name}" solo permite un máximo de ${targetBoard.wipLimit} tareas simultáneas.`,
        );
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: { assignee: { select: { name: true } } },
    });

    if (tags !== undefined) {
      await this.handleTaskTags(id, oldTask.projectId, tags);
    }

    const metaObj: any = { title: updatedTask.title };
    const changes: Record<string, { from: any; to: any }> = {};
    let hasChanges = false;
    let wasAssignedToSomeoneElse = false;
    let wasMoved = false;

    if (taskData.title !== undefined && taskData.title !== oldTask.title) {
      changes.title = { from: oldTask.title, to: taskData.title };
      hasChanges = true;
    }
    if (
      taskData.description !== undefined &&
      taskData.description !== oldTask.description
    ) {
      changes.description = {
        from: oldTask.description || 'Sin descripción',
        to: taskData.description || 'Sin descripción',
      };
      hasChanges = true;
    }
    if (
      taskData.priority !== undefined &&
      taskData.priority !== oldTask.priority
    ) {
      changes.priority = { from: oldTask.priority, to: taskData.priority };
      hasChanges = true;
    }
    if (
      taskData.startDate !== undefined &&
      taskData.startDate !== oldTask.startDate
    ) {
      changes.startDate = { from: oldTask.startDate, to: taskData.startDate };
      hasChanges = true;
    }
    if (
      taskData.dueDate !== undefined &&
      taskData.dueDate !== oldTask.dueDate
    ) {
      changes.dueDate = { from: oldTask.dueDate, to: taskData.dueDate };
      hasChanges = true;
    }

    if (taskData.status !== undefined && taskData.status !== oldTask.status) {
      metaObj.previousStatus = oldTask.status;
      metaObj.newStatus = taskData.status;
      hasChanges = true;
    }

    if (
      taskData.sprintId !== undefined &&
      taskData.sprintId !== oldTask.sprintId
    ) {
      metaObj.previousSprint = oldTask.sprintId;
      metaObj.newSprint = taskData.sprintId;
      hasChanges = true;
    }

    if (
      taskData.boardId !== undefined &&
      taskData.boardId !== oldTask.boardId
    ) {
      metaObj.previousBoard = oldTask.boardId;
      metaObj.newBoard = taskData.boardId;
      hasChanges = true;
      wasMoved = true;
    }

    if (
      taskData.assigneeId !== undefined &&
      taskData.assigneeId !== oldTask.assigneeId
    ) {
      changes.assignee = {
        from: oldTask.assignee?.name || 'Nadie',
        to: updatedTask.assignee?.name || 'Nadie',
      };
      hasChanges = true;
      wasAssignedToSomeoneElse = true;
    }

    if (tags !== undefined) {
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
          action: wasMoved
            ? ActivityAction.MOVED
            : wasAssignedToSomeoneElse
              ? ActivityAction.ASSIGNED
              : ActivityAction.UPDATED,
          entity: ActivityEntity.TASK,
          entityId: updatedTask.id,
          meta: metaObj,
        },
      });
    }

    const finalTask = await this.prisma.task.findUnique({
      where: { id: id },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!finalTask) return null;

    return {
      ...finalTask,
      tags: finalTask.tags.map((tt) => tt.tag.name),
    };
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
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: projectId,
        ...(sprintId ? { sprintId } : {}),
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        tags: { include: { tag: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    return tasks.map((task) => ({
      ...task,
      tags: task.tags.map((tt) => tt.tag.name),
      assignee: task.assignee
        ? { ...task.assignee, userId: task.assignee.id }
        : null,

      comments: task.comments
        ? task.comments.map((comment) => ({
            ...comment,
            author: {
              ...comment.author,
              userId: comment.author.id,
            },
          }))
        : [],
    }));
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

  async addComment(taskId: string, userId: string, content: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        title: true,
        assigneeId: true,
        project: { select: { name: true } },
      },
    });

    if (!task) {
      throw new NotFoundException('La tarea no existe.');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        taskId: task.id,
        authorId: userId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const excerpt =
      content.length > 50 ? content.substring(0, 50) + '...' : content;

    await this.prisma.activityLog.create({
      data: {
        projectId: task.projectId,
        userId: userId,
        action: ActivityAction.COMMENTED,
        entity: ActivityEntity.COMMENT,
        entityId: comment.id,
        meta: {
          taskId: task.id,
          taskTitle: task.title,
          excerpt: excerpt,
        },
      },
    });

    if (task.assigneeId && task.assigneeId !== userId) {
      const projectName = task.project?.name || 'Proyecto';

      this.notificationsService
        .createSystemNotification({
          userId: task.assigneeId!,
          type: NotificationType.COMMENTARY_MENTION,
          title: '💬 Nuevo comentario',
          message: `[${projectName}] ${comment.author.name} comentó en "${task.title}": ${excerpt}`,
          entityId: task.id,
        })
        .catch((err) => console.error('Error enviando notificación:', err));
    }

    return {
      ...comment,
      author: {
        ...comment.author,
        userId: comment.author.id,
      },
    };
  }

  private async handleTaskTags(
    taskId: string,
    projectId: string,
    tagNames: string[],
  ) {
    await this.prisma.taskTag.deleteMany({
      where: { taskId },
    });

    if (tagNames.length === 0) return;

    const cleanTags = tagNames.map((t) => t.trim().toLowerCase());

    for (const tagName of cleanTags) {
      let tag = await this.prisma.tag.findUnique({
        where: {
          name_projectId: {
            name: tagName,
            projectId: projectId,
          },
        },
      });

      if (!tag) {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        tag = await this.prisma.tag.create({
          data: {
            name: tagName,
            projectId: projectId,
            color: randomColor,
          },
        });
      }

      await this.prisma.taskTag.create({
        data: {
          taskId: taskId,
          tagId: tag.id,
        },
      });
    }
  }
}
