import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user;
    const args = ctx.getArgs();

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    const userId = user.id || user.userId || user.sub;

    let projectId: string | undefined;
    let entityId: string | undefined;

    if (args.projectId) {
      projectId = args.projectId;
    }
    if (args.id && typeof args.id === 'string') {
      entityId = args.id;
    }

    if (!projectId && !entityId) {
      const inputObject = Object.values(args).find(
        (val) => typeof val === 'object' && val !== null,
      ) as any;

      if (inputObject) {
        if (inputObject.projectId) projectId = inputObject.projectId;
        if (inputObject.id) entityId = inputObject.id;
      }
    }

    if (!projectId && entityId) {
      const task = await this.prisma.task.findUnique({
        where: { id: entityId },
        select: { projectId: true },
      });
      if (task) projectId = task.projectId;

      if (!projectId) {
        const board = await this.prisma.board.findUnique({
          where: { id: entityId },
          select: { projectId: true },
        });
        if (board) projectId = board.projectId;
      }

      if (!projectId) {
        const sprint = await this.prisma.sprint.findUnique({
          where: { id: entityId },
          select: { projectId: true },
        });
        if (sprint) projectId = sprint.projectId;
      }
    }

    if (!projectId) {
      throw new BadRequestException(
        'No se pudo determinar el proyecto para validar permisos.',
      );
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'No perteneces a este proyecto o tu invitación está pendiente.',
      );
    }

    const hasPermission = requiredRoles.includes(membership.role);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Tu rol (${membership.role}) no tiene permisos para realizar esta acción.`,
      );
    }

    return true;
  }
}
