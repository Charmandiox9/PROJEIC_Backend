import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Shape completo de un proyecto con members anidados
export type ProjectWithMembers = Prisma.ProjectGetPayload<{
  include: {
    members: {
      include: { user: { select: { id: true; name: true; avatarUrl: true } } };
    };
  };
}>;

// Shape básico sin relaciones
export type ProjectBase = Prisma.ProjectGetPayload<Record<string, never>>;

/**
 * Data-access layer for Projects.
 * Responsibility: translate domain calls into Prisma queries.
 * Business rules live in ProjectsService, NOT here.
 */
@Injectable()
export class ProjectsRepository {
  private readonly logger = new Logger(ProjectsRepository.name);

  // Include reutilizable para queries que necesitan members
  private readonly membersInclude = {
    members: {
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ProjectCreateInput): Promise<ProjectBase> {
    this.logger.debug(`Creating project: ${data.name}`);
    return this.prisma.project.create({ data });
  }

  async findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        subject: {
          include: {
            professors: true,
          },
        },
        repositories: true,
        documents: {
          include: {
            uploadedBy: true,
          },
        },
        wallet: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            costs: {
              where: { isActive: true },
            },
          },
        },
      },
    });
  }

  async findMany(
    where: Prisma.ProjectWhereInput,
    skip = 0,
    take = 20,
    includeMembers = false,
  ): Promise<ProjectBase[] | ProjectWithMembers[]> {
    return this.prisma.project.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: {
          include: {
            professors: true,
          },
        },

        ...(includeMembers ? this.membersInclude : {}),
      },
    }) as Promise<ProjectBase[] | ProjectWithMembers[]>;
  }

  async count(where: Prisma.ProjectWhereInput): Promise<number> {
    return this.prisma.project.count({ where });
  }

  async update(
    id: string,
    data: Prisma.ProjectUpdateInput,
  ): Promise<ProjectBase> {
    this.logger.debug(`Updating project ${id}`);
    return this.prisma.project.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<ProjectBase> {
    this.logger.debug(`Archiving project ${id}`);
    return this.prisma.project.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async hardDelete(id: string): Promise<ProjectBase> {
    this.logger.debug(`Hard deleting project ${id}`);
    return this.prisma.project.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.project.count({ where: { id } });
    return count > 0;
  }
}
