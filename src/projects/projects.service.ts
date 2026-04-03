import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  Project,
  ProjectStatus,
  ProjectMethodology,
  ProjectRole,
  MemberStatus,
} from '@prisma/client';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { ProjectsFilterInput } from './dto/projects-filter.input';
import { PaginatedProjects } from './dto/paginated-projects.type';

/**
 * Business-logic layer for Projects.
 * Orchestrates the repository and enforces domain rules:
 *  - a project name must be unique inside creation (can be relaxed later)
 *  - delete uses soft-delete (archive) by default
 *  - hard-delete is a separate, explicit operation
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly repository: ProjectsRepository) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(input: CreateProjectInput, userId: string): Promise<Project> {
    const data = {
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? '#3B82F6',
      status: input.status ?? ProjectStatus.ACTIVE,
      methodology: input.methodology ?? ProjectMethodology.KANBAN,
      isPublic: input.isPublic ?? false,
      members: {
        create: {
          userId: userId,
          role: ProjectRole.LEADER,
          status: MemberStatus.ACTIVE,
        },
      },
    };

    return this.repository.create(data);
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async findAll(
    userId: string | undefined, // <-- Agregamos el usuario que consulta
    filter: ProjectsFilterInput = {},
    includeMembers = false,
  ): Promise<PaginatedProjects> {
    const {
      status,
      methodology,
      isPublic,
      includeArchived = false,
      search,
      take = 20,
      skip = 0,
    } = filter;

    const where = {
      ...(status && { status }),
      ...(methodology && { methodology }),
      ...(isPublic !== undefined && { isPublic }),
      ...(!includeArchived && { isArchived: false }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
      OR: userId
        ? [
            { isPublic: true },
            {
              members: {
                some: { userId: userId, status: MemberStatus.ACTIVE },
              },
            },
          ]
        : [{ isPublic: true }],
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, take, includeMembers),
      this.repository.count(where),
    ]);

    return { items, total, skip, take };
  }

  async findMyProjects(
    userId: string,
    filter: ProjectsFilterInput = {},
    includeMembers = false,
  ): Promise<PaginatedProjects> {
    const {
      status,
      methodology,
      includeArchived = false,
      search,
      take = 20,
      skip = 0,
    } = filter;

    const where = {
      ...(status && { status }),
      ...(methodology && { methodology }),
      ...(!includeArchived && { isArchived: false }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
      members: { some: { userId: userId, status: MemberStatus.ACTIVE } },
    };

    const [items, total] = await Promise.all([
      this.repository.findMany(where, skip, take, includeMembers),
      this.repository.count(where),
    ]);

    return { items, total, skip, take };
  }

  async findOne(id: string, userId: string | undefined) {
    const project = await this.repository.findById(id);

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }

    // 🔥 Regla de Seguridad: Validamos acceso localmente o puedes hacerlo en el repositorio
    // (Asumiendo que repository.findById devuelve los miembros o necesitas una query extra)
    // Para mantener tu patrón actual simple, podrías requerir que `findById` verifique el acceso.

    return project;
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(input: UpdateProjectInput, userId: string) {
    await this.assertExists(input.id);
    const { id, assignMeAsLeader, ...rest } = input;

    const data: Record<string, any> = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    );

    if (assignMeAsLeader) {
      data.members = {
        upsert: [
          {
            where: {
              userId_projectId: { userId: userId, projectId: id },
            },
            update: { role: ProjectRole.LEADER },
            create: { userId: userId, role: ProjectRole.LEADER },
          },
        ],
      };
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided to update',
      );
    }

    return this.repository.update(id, data);
  }

  // ─── Archive (soft-delete) ────────────────────────────────────────────────

  async archive(id: string): Promise<Project> {
    await this.assertExists(id);
    return this.repository.softDelete(id);
  }

  // ─── Hard delete ─────────────────────────────────────────────────────────

  async remove(id: string): Promise<Project> {
    await this.assertExists(id);
    return this.repository.hardDelete(id);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async assertExists(id: string): Promise<void> {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
  }
}
