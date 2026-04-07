import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AddProjectMemberInput } from './dto/add-member.input';
import { UpdateProjectMemberInput } from './dto/update-member.input';
import { ActivityEntity, ActivityAction } from '@prisma/client';
import { ProjectsService } from 'src/projects/projects.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private readonly projectsService: ProjectsService,
  ) {}

  async addMember(input: AddProjectMemberInput, requesterId: string) {
    const requesterMembership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: requesterId, projectId: input.projectId },
      },
    });

    if (!requesterMembership || requesterMembership.role !== 'LEADER') {
      throw new ForbiddenException('Solo los líderes pueden agregar miembros.');
    }

    const userToAdd = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!userToAdd) {
      throw new NotFoundException(
        `No hay ningún usuario con el correo ${input.email}`,
      );
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: userToAdd.id, projectId: input.projectId },
      },
    });

    if (existingMember) {
      if (existingMember.status === 'PENDING') {
        throw new ConflictException(
          'Este usuario ya tiene una invitación pendiente.',
        );
      }
      throw new ConflictException(
        'El usuario ya es miembro activo de este proyecto.',
      );
    }

    const newMember = await this.prisma.projectMember.create({
      data: {
        projectId: input.projectId,
        userId: userToAdd.id,
        role: input.role,
        status: 'PENDING',
      },
      include: {
        project: true,
        user: true,
      },
    });

    await this.notificationsService.createSystemNotification({
      userId: userToAdd.id,
      type: 'PROJECT_INVITATION',
      title: 'Nueva invitación a proyecto',
      message: `Has sido invitado a participar en "${newMember.project.name}" como ${input.role}.`,
      entityId: input.projectId,
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: input.projectId,
        userId: requesterId,
        action: ActivityAction.CREATED,
        entity: ActivityEntity.MEMBER,
        entityId: newMember.id,
        meta: { title: userToAdd.name, role: input.role },
      },
    });

    return newMember;
  }

  async respondToInvitation(
    projectId: string,
    userId: string,
    accept: boolean,
  ) {
    const invitation = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    await this.prisma.notification.deleteMany({
      where: { userId, type: 'PROJECT_INVITATION', entityId: projectId },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException(
        'No tienes ninguna invitación pendiente para este proyecto.',
      );
    }

    if (accept) {
      const activeMember = await this.prisma.projectMember.update({
        where: { id: invitation.id },
        data: { status: 'ACTIVE' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      await this.prisma.activityLog.create({
        data: {
          projectId: invitation.projectId,
          userId: userId,
          action: ActivityAction.JOINED,
          entity: ActivityEntity.MEMBER,
          entityId: invitation.id,
          meta: { role: invitation.role },
        },
      });

      await this.projectsService.recalculateWipLimits(projectId);

      return activeMember;
    } else {
      await this.prisma.projectMember.delete({
        where: { id: invitation.id },
      });
      return null;
    }
  }

  async updateRole(input: UpdateProjectMemberInput, requesterId: string) {
    const oldMember = await this.prisma.projectMember.findUnique({
      where: { id: input.memberId },
      include: { user: { select: { name: true } } },
    });

    if (!oldMember) {
      throw new NotFoundException('Miembro no encontrado');
    }

    const updatedMember = await this.prisma.projectMember.update({
      where: { id: input.memberId },
      data: { role: input.role },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    if (oldMember.role !== input.role) {
      await this.prisma.activityLog.create({
        data: {
          projectId: updatedMember.projectId,
          userId: requesterId,
          action: ActivityAction.UPDATED,
          entity: ActivityEntity.MEMBER,
          entityId: updatedMember.id,
          meta: {
            title: updatedMember.user.name,
            previousRole: oldMember.role,
            newRole: input.role,
          },
        },
      });
    }

    return updatedMember;
  }

  async removeMember(memberId: string, requesterId: string) {
    const memberToDelete = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!memberToDelete) throw new NotFoundException('Miembro no encontrado');

    await this.prisma.projectMember.delete({
      where: { id: memberId },
    });

    const isLeaving = requesterId === memberToDelete.userId;

    await this.projectsService.recalculateWipLimits(memberToDelete.projectId);

    await this.prisma.activityLog.create({
      data: {
        projectId: memberToDelete.projectId,
        userId: requesterId,
        action: isLeaving ? ActivityAction.LEFT : ActivityAction.DELETED,
        entity: ActivityEntity.MEMBER,
        entityId: memberId,
        meta: { title: memberToDelete.user.name },
      },
    });

    return { success: true };
  }
}
