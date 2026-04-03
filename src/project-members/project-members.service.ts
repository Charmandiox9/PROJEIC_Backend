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

@Injectable()
export class ProjectMembersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
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

    return newMember;
  }

  async respondToInvitation(
    projectId: string,
    userId: string,
    accept: boolean,
  ) {
    const invitation = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    // Limpieza agresiva de notificaciones antes de validar. 
    // Si la invitación ya fue procesada o borrada por DB, limpiamos la notificación atascada.
    await this.prisma.notification.deleteMany({
      where: {
        userId: userId,
        type: 'PROJECT_INVITATION',
        entityId: projectId,
      },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException(
        'No tienes ninguna invitación pendiente para este proyecto.',
      );
    }

    if (accept) {
      return this.prisma.projectMember.update({
        where: { id: invitation.id },
        data: { status: 'ACTIVE' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });
    } else {
      await this.prisma.projectMember.delete({
        where: { id: invitation.id },
      });
      return null;
    }
  }

  async updateRole(input: UpdateProjectMemberInput, requesterId: string) {
    return this.prisma.projectMember.update({
      where: { id: input.memberId },
      data: { role: input.role },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async removeMember(memberId: string, requesterId: string) {
    // Validar permisos antes de borrar
    return this.prisma.projectMember.delete({
      where: { id: memberId },
    });
  }
}
