import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddProjectMemberInput } from './dto/add-member.input';
import { UpdateProjectMemberInput } from './dto/update-member.input';

@Injectable()
export class ProjectMembersService {
  constructor(private prisma: PrismaService) {}

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
      throw new ConflictException('El usuario ya es miembro de este proyecto.');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId: input.projectId,
        userId: userToAdd.id,
        role: input.role,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true }, // El PublicUser exacto
        },
      },
    });
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
