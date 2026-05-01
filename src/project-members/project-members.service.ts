import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { ProjectsService } from 'src/projects/projects.service';
import { AddProjectMemberInput } from './dto/add-member.input';
import { UpdateProjectMemberInput } from './dto/update-member.input';
import { ActivityEntity, ActivityAction } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class ProjectMembersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private emailService: EmailService,
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

    const project = await this.prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new NotFoundException(
        'El proyecto al que intentas invitar no existe.',
      );
    }

    // Obtenemos los datos de quien invita para el correo
    const inviter = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });
    const inviterName = inviter?.name || 'Administrador';

    const userToAdd = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    let frontendUrl =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
    const cleanFrontendUrl = frontendUrl
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\/$/, '');

    // ==========================================
    // ESCENARIO A: EL USUARIO NO EXISTE
    // ==========================================
    if (!userToAdd) {
      const inviteToken = randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const pendingInvite = await this.prisma.projectInvitation.create({
        data: {
          email: input.email,
          projectId: input.projectId,
          role: input.role,
          token: inviteToken,
          expiresAt: expiresAt,
        },
      });

      const inviteUrl = `${cleanFrontendUrl}/projeic/auth/login?invite_token=${inviteToken}`;

      await this.emailService.sendProjectInvitation(
        input.email,
        project.name,
        inviteUrl,
        project.description || '',
        project.status,
        project.methodology,
        project.isInstitutional,
        input.role || project.mode,
        inviterName,
      );

      // ✅ Retornamos el objeto exitosamente en lugar de lanzar una excepción
      // Asegúrate de que esto coincida con lo que espera tu esquema GraphQL
      return {
        id: pendingInvite.id,
        role: pendingInvite.role,
        status: 'PENDING',
      };
    }

    // ==========================================
    // ESCENARIO B: EL USUARIO YA EXISTE
    // ==========================================

    // Verificamos que no sea miembro ya
    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: userToAdd.id, projectId: input.projectId },
      },
    });

    if (existingMember) {
      throw new ConflictException(
        'El usuario ya es miembro de este proyecto o ya ha sido invitado.',
      );
    }

    // Lo agregamos directamente a la tabla ProjectMember
    const newMember = await this.prisma.projectMember.create({
      data: {
        userId: userToAdd.id,
        projectId: input.projectId,
        role: input.role,
        status: 'PENDING', // O 'ACTIVE' si no requieres que acepte
      },
    });

    // Construimos una URL directa al proyecto
    const projectUrl = `${cleanFrontendUrl}/projeic/misc/proyectos/${project.id}`;

    // 🔥 ¡Ahora sí le enviamos correo al usuario existente!
    await this.emailService.sendProjectInvitation(
      input.email,
      project.name,
      projectUrl,
      project.description || '',
      project.status,
      project.methodology,
      project.isInstitutional,
      input.role || project.mode,
      inviterName,
    );

    return newMember;
  }

  async respondToInvitation(
    projectId: string,
    userId: string,
    accept: boolean,
  ) {
    let membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!membership) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado.');
      }

      const invitation = await this.prisma.projectInvitation.findFirst({
        where: {
          projectId: projectId,
          email: user.email,
        },
      });

      if (!invitation) {
        throw new NotFoundException(
          'No tienes ninguna invitación pendiente para este proyecto.',
        );
      }

      if (accept) {
        membership = await this.prisma.projectMember.create({
          data: {
            projectId: projectId,
            userId: userId,
            role: invitation.role,
            status: 'ACTIVE',
          },
        });

        await this.prisma.projectInvitation.delete({
          where: { id: invitation.id },
        });
      } else {
        await this.prisma.projectInvitation.delete({
          where: { id: invitation.id },
        });
        return null;
      }
    }

    if (membership && membership.status === 'PENDING') {
      if (accept) {
        membership = await this.prisma.projectMember.update({
          where: { id: membership.id },
          data: { status: 'ACTIVE' },
        });
      } else {
        await this.prisma.projectMember.delete({
          where: { id: membership.id },
        });
        return null;
      }
    }

    if (accept && membership) {
      await this.prisma.activityLog.create({
        data: {
          projectId,
          userId,
          action: ActivityAction.JOINED,
          entity: ActivityEntity.MEMBER,
          entityId: membership.id,
          meta: { role: membership.role },
        },
      });

      await this.projectsService.recalculateWipLimits(projectId);
      return membership;
    }

    return null;
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

  async redeemProjectInvitation(token: string, userId: string) {
    const invitation = await this.prisma.projectInvitation.findUnique({
      where: { token },
      include: { project: true },
    });

    if (!invitation) {
      throw new NotFoundException(
        'La invitación no existe o ya fue utilizada.',
      );
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.projectInvitation.delete({
        where: { id: invitation.id },
      });
      throw new ForbiddenException('Esta invitación ha expirado.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    if (user.email !== invitation.email) {
      throw new ForbiddenException(
        'Esta invitación fue enviada a otro correo electrónico.',
      );
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId: invitation.projectId } },
    });

    if (existingMember) {
      await this.prisma.projectInvitation.delete({
        where: { id: invitation.id },
      });
      throw new ConflictException('Ya eres miembro de este proyecto.');
    }

    const newMember = await this.prisma.projectMember.create({
      data: {
        projectId: invitation.projectId,
        userId: userId,
        role: invitation.role,
        status: 'PENDING',
      },
      include: { project: true },
    });

    await this.notificationsService.createSystemNotification({
      userId: userId,
      type: 'PROJECT_INVITATION',
      title: 'Nueva invitación a proyecto',
      message: `Has sido invitado a participar en "${newMember.project.name}" como ${invitation.role}.`,
      entityId: invitation.projectId,
    });

    await this.prisma.projectInvitation.delete({
      where: { id: invitation.id },
    });
    await this.prisma.activityLog.create({
      data: {
        projectId: invitation.projectId,
        userId: userId,
        action: ActivityAction.JOINED,
        entity: ActivityEntity.MEMBER,
        entityId: newMember.id,
        meta: { role: invitation.role, method: 'EMAIL_INVITE' },
      },
    });

    return newMember;
  }
}
