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
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

/**
 * Business-logic layer for Projects.
 * Orchestrates the repository and enforces domain rules:
 * - a project name must be unique inside creation (can be relaxed later)
 * - delete uses soft-delete (archive) by default
 * - hard-delete is a separate, explicit operation
 */
@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly repository: ProjectsRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(input: CreateProjectInput, userId: string): Promise<Project> {
    const initialMembers: {
      userId: string;
      role: ProjectRole;
      status: MemberStatus;
    }[] = [
      {
        userId: userId,
        role: ProjectRole.LEADER,
        status: MemberStatus.ACTIVE,
      },
    ];

    if (input.isInstitutional && input.professorId) {
      initialMembers.push({
        userId: input.professorId,
        role: ProjectRole.SUPERVISOR,
        status: MemberStatus.ACTIVE,
      });
    }

    const data = {
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? '#3B82F6',
      status: input.status ?? ProjectStatus.ACTIVE,
      methodology: input.methodology ?? ProjectMethodology.KANBAN,
      isPublic: input.isPublic ?? false,
      isInstitutional: input.isInstitutional ?? false,
      subjectId: input.isInstitutional ? input.subjectId : null,

      members: {
        create: initialMembers,
      },
    };

    return this.repository.create(data);
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async findAll(
    userId: string | undefined,
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

  async update(input: UpdateProjectInput, userId: string) {
    await this.assertExists(input.id);
    const { id, assignMeAsLeader, ...rest } = input;

    const data: Record<string, any> = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    );

    const membersUpserts = [];

    const notifiedProfessors: string[] = [];
    let subjectName = '';

    if (assignMeAsLeader) {
      membersUpserts.push({
        where: {
          userId_projectId: { userId: userId, projectId: id },
        },
        update: { role: ProjectRole.LEADER },
        create: {
          userId: userId,
          role: ProjectRole.LEADER,
          status: MemberStatus.ACTIVE,
        },
      });
    }

    if (input.isInstitutional && input.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: input.subjectId },
        include: { professors: true },
      });

      if (subject && subject.professors) {
        subjectName = subject.name;

        for (const prof of subject.professors) {
          membersUpserts.push({
            where: {
              userId_projectId: { userId: prof.id, projectId: id },
            },
            update: {
              role: ProjectRole.SUPERVISOR,
              status: MemberStatus.ACTIVE,
            },
            create: {
              userId: prof.id,
              role: ProjectRole.SUPERVISOR,
              status: MemberStatus.ACTIVE,
            },
          });

          notifiedProfessors.push(prof.id);
        }
      }
    }

    if (membersUpserts.length > 0) {
      data.members = {
        upsert: membersUpserts,
      };
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided to update',
      );
    }

    const updatedProject = await this.repository.update(id, data);

    if (notifiedProfessors.length > 0) {
      await Promise.all(
        notifiedProfessors.map((profId) =>
          this.notificationsService.createSystemNotification({
            userId: profId,
            type: 'PROJECT_INVITATION',
            title: 'Nuevo proyecto en tu asignatura',
            message: `El proyecto "${updatedProject.name}" se ha vinculado a tu asignatura de ${subjectName}. Tienes acceso como Supervisor.`,
            entityId: updatedProject.id,
          }),
        ),
      );
    }

    return updatedProject;
  }

  async archive(id: string): Promise<Project> {
    await this.assertExists(id);
    return this.repository.softDelete(id);
  }

  async remove(id: string): Promise<Project> {
    await this.assertExists(id);
    return this.repository.hardDelete(id);
  }

  private async assertExists(id: string): Promise<void> {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
  }
}
