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
}
