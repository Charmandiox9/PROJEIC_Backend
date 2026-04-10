import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  async findByProject(projectId: string) {
    const logs = await this.prisma.activityLog.findMany({
      where: { projectId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs.map((log) => ({
      ...log,
      meta: log.meta ? JSON.stringify(log.meta) : null,
    }));
  }

  async myWeeklyActivityPoints(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await this.prisma.activityLog.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { action: true, entity: true },
    });

    let points = 0;
    for (const log of logs) {
      if (log.action === 'CREATED' && log.entity === 'TASK') points += 2;
      else if (log.action === 'UPDATED' && log.entity === 'TASK') points += 1;
      else if (log.action === 'COMMENTED') points += 1;
      else if (log.action === 'CREATED' && log.entity === 'EXPECTED_RESULT')
        points += 5;
      else points += 1;
    }

    return points;
  }

  async myRecentFeed(userId: string) {
    const myProjects = await this.prisma.projectMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { projectId: true },
    });

    const projectIds = myProjects.map((p) => p.projectId);

    if (projectIds.length === 0) return [];

    return this.prisma.activityLog.findMany({
      where: {
        projectId: { in: projectIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, avatarUrl: true } },
        project: { select: { name: true } },
      },
    });
  }
}
