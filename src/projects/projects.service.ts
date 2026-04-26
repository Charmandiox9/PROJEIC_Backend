import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import {
  Project,
  ProjectStatus,
  ProjectMethodology,
  ProjectRole,
  MemberStatus,
  ProjectMode,
  ActivityAction,
  ActivityEntity,
} from '@prisma/client';
import { ProjectsRepository } from './projects.repository';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { ProjectsFilterInput } from './dto/projects-filter.input';
import { PaginatedProjects } from './dto/paginated-projects.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ProjectMembersService } from 'src/project-members/project-members.service';
import { BoardsService } from 'src/boards/boards.service';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly repository: ProjectsRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly boardsService: BoardsService,
    @Inject(forwardRef(() => ProjectMembersService))
    private readonly projectMembersService: ProjectMembersService,
  ) {}

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

    const data = {
      name: input.name,
      description: input.description ?? null,
      color: input.color ?? '#3B82F6',
      status: input.status ?? ProjectStatus.ACTIVE,

      isPublic: input.isPublic ?? false,
      isInstitutional: input.isInstitutional ?? false,
      subjectId: input.isInstitutional ? input.subjectId : null,

      mode: input.mode ?? ProjectMode.CLASSIC,

      methodology:
        input.mode === ProjectMode.HYBRID
          ? ProjectMethodology.NONE
          : (input.methodology ?? ProjectMethodology.KANBAN),

      members: {
        create: initialMembers,
      },
    };

    const newProject = await this.repository.create(data);

    await this.prisma.activityLog.create({
      data: {
        projectId: newProject.id,
        userId: userId,
        action: ActivityAction.CREATED,
        entity: ActivityEntity.PROJECT,
        entityId: newProject.id,
        meta: { title: newProject.name },
      },
    });

    if (
      newProject.methodology === ProjectMethodology.KANBAN ||
      newProject.methodology === ProjectMethodology.SCRUM ||
      newProject.methodology === ProjectMethodology.SCRUMBAN
    ) {
      await this.boardsService.createDefaultBoards(newProject.id, userId);
    }

    await this.recalculateWipLimits(newProject.id);

    if (
      input.isInstitutional &&
      input.professorId &&
      input.professorId !== userId
    ) {
      const professor = await this.prisma.user.findUnique({
        where: { id: input.professorId },
        select: { email: true },
      });

      if (professor) {
        await this.projectMembersService.addMember(
          {
            projectId: newProject.id,
            email: professor.email,
            role: ProjectRole.SUPERVISOR,
          },
          userId,
        );
      }
    }

    return newProject;
  }

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

    return project;
  }

  async update(input: UpdateProjectInput, userId: string) {
    await this.assertExists(input.id);

    const oldProject = await this.repository.findById(input.id);

    if (!oldProject) {
      throw new NotFoundException(`Project with id "${input.id}" not found`);
    }

    const { id, assignMeAsLeader, ...rest } = input;

    const data: Record<string, any> = Object.fromEntries(
      Object.entries(rest).filter(([, v]) => v !== undefined),
    );

    const membersUpserts = [];
    const notifiedProfessors: string[] = [];
    let subjectName = '';

    const isNewSubjectAssigned =
      input.isInstitutional && input.subjectId !== oldProject.subjectId;

    if (assignMeAsLeader) {
      membersUpserts.push({
        where: { userId_projectId: { userId: userId, projectId: id } },
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
            where: { userId_projectId: { userId: prof.id, projectId: id } },
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
          if (isNewSubjectAssigned) {
            notifiedProfessors.push(prof.id);
          }
        }
      }
    }

    if (membersUpserts.length > 0) {
      data.members = { upsert: membersUpserts };
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

    const changes: Record<string, { from: any; to: any }> = {};

    if (input.name !== undefined && input.name !== oldProject.name) {
      changes.name = { from: oldProject.name, to: input.name };
    }
    if (input.status !== undefined && input.status !== oldProject.status) {
      changes.status = { from: oldProject.status, to: input.status };
    }
    if (
      input.description !== undefined &&
      input.description !== oldProject.description
    ) {
      changes.description = {
        from: oldProject.description || 'Sin descripción',
        to: input.description || 'Sin descripción',
      };
    }
    if (input.color !== undefined && input.color !== oldProject.color) {
      changes.color = { from: oldProject.color, to: input.color };
    }
    if (input.mode !== undefined && input.mode !== oldProject.mode) {
      changes.mode = { from: oldProject.mode, to: input.mode };
    }
    if (
      input.isPublic !== undefined &&
      input.isPublic !== oldProject.isPublic
    ) {
      changes.isPublic = { from: oldProject.isPublic, to: input.isPublic };
    }
    if (
      input.isInstitutional !== undefined &&
      input.isInstitutional !== oldProject.isInstitutional
    ) {
      changes.isInstitutional = {
        from: oldProject.isInstitutional,
        to: input.isInstitutional,
      };
    }

    if (
      input.githubOwner !== undefined &&
      input.githubOwner !== oldProject.githubOwner
    ) {
      changes.githubOwner = {
        from: oldProject.githubOwner || 'Desvinculado',
        to: input.githubOwner || 'Desvinculado',
      };
    }

    if (
      input.githubRepo !== undefined &&
      input.githubRepo !== oldProject.githubRepo
    ) {
      changes.githubRepo = {
        from: oldProject.githubRepo || 'Desvinculado',
        to: input.githubRepo || 'Desvinculado',
      };
    }

    if (Object.keys(changes).length > 0) {
      await this.prisma.activityLog.create({
        data: {
          projectId: id,
          userId: userId,
          action: ActivityAction.UPDATED,
          entity: ActivityEntity.PROJECT,
          entityId: id,
          meta: {
            title: updatedProject.name,
            changes: changes,
          },
        },
      });
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

  async recalculateWipLimits(projectId: string) {
    const membersCount = await this.prisma.projectMember.count({
      where: { projectId, status: 'ACTIVE' },
    });
    const calculatedWip = Math.ceil(membersCount * 1.5);
    await this.prisma.board.updateMany({
      where: {
        projectId,
        name: { in: ['En progreso', 'En revisión', 'In Progress', 'Review'] },
      },
      data: { wipLimit: calculatedWip },
    });

    return calculatedWip;
  }

  async getProjectsActiveCount(): Promise<number> {
    return this.prisma.project.count({
      where: {
        status: ProjectStatus.ACTIVE,
        isArchived: false,
      },
    });
  }

  private async assertExists(id: string): Promise<void> {
    const exists = await this.repository.exists(id);
    if (!exists) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }
  }
}
