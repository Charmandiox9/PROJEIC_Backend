import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSprintInput } from './dto/create-sprint.input';
import { ActivityAction, ActivityEntity, SprintStatus } from '@prisma/client';

@Injectable()
export class SprintsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateSprintInput, userId: string) {
    const newSprint = await this.prisma.sprint.create({
      data: {
        ...input,
        status: SprintStatus.PLANNED,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: input.projectId,
        userId,
        action: ActivityAction.CREATED,
        entity: ActivityEntity.SPRINT,
        entityId: newSprint.id,
        meta: { title: newSprint.name },
      },
    });

    return newSprint;
  }

  async findAllByProject(projectId: string) {
    try {
      return await this.prisma.sprint.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('🔥 ERROR AL TRAER SPRINTS:', error);
      throw error;
    }
  }

  async startSprint(id: string, projectId: string, userId: string) {
    const activeSprint = await this.prisma.sprint.findFirst({
      where: { projectId, status: 'ACTIVE' },
    });

    if (activeSprint) {
      throw new BadRequestException(
        'Ya hay un Sprint activo en este proyecto. Termínalo primero.',
      );
    }

    const sprintToStart = await this.prisma.sprint.findUnique({
      where: { id },
    });

    const now = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(now.getDate() + 14);

    const startedSprint = await this.prisma.sprint.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startDate: sprintToStart?.startDate || now,
        endDate: sprintToStart?.endDate || twoWeeksLater,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId,
        userId,
        action: ActivityAction.UPDATED,
        entity: ActivityEntity.SPRINT,
        entityId: id,
        meta: {
          title: startedSprint.name,
          changes: { status: { to: 'ACTIVE' } },
        },
      },
    });

    return startedSprint;
  }

  async completeSprint(id: string, userId: string) {
    const completedSprint = await this.prisma.sprint.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: completedSprint.projectId,
        userId,
        action: ActivityAction.UPDATED,
        entity: ActivityEntity.SPRINT,
        entityId: id,
        meta: {
          title: completedSprint.name,
          changes: { status: { to: 'COMPLETED' } },
        },
      },
    });

    return completedSprint;
  }

  async getSprintBurndown(sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: { tasks: true },
    });

    if (!sprint || !sprint.startDate || !sprint.endDate) {
      throw new Error('El sprint no existe o no tiene fechas definidas');
    }

    const totalTasks = sprint.tasks.length;
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);

    const sprintDurationDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 3600 * 24),
    );

    const completedTasks = sprint.tasks.filter((t) => t.status === 'DONE');

    const burndownData = [];

    for (let i = 0; i <= sprintDurationDays; i++) {
      const currentDay = new Date(start);
      currentDay.setDate(start.getDate() + i);

      const idealRemaining = Math.max(
        0,
        totalTasks - (totalTasks / sprintDurationDays) * i,
      );
      let completedOnOrBeforeThisDay = 0;

      const endOfDay = new Date(currentDay);
      endOfDay.setHours(23, 59, 59, 999);

      completedTasks.forEach((task) => {
        if (new Date(task.updatedAt) <= endOfDay) {
          completedOnOrBeforeThisDay++;
        }
      });

      const realRemaining = totalTasks - completedOnOrBeforeThisDay;

      const isFuture = currentDay > new Date();

      burndownData.push({
        date: currentDay.toISOString().split('T')[0],
        dayLabel: `Día ${i + 1}`,
        ideal: parseFloat(idealRemaining.toFixed(1)),
        real: isFuture ? null : realRemaining,
      });
    }

    return burndownData;
  }
}
