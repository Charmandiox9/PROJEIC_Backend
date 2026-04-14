import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    const userId = user.id || user.userId || user.sub;

    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('Usuario no encontrado en el sistema.');
    }

    if (!dbUser.isAdmin) {
      throw new ForbiddenException(
        'Acceso denegado: Esta acción es exclusiva para Administradores del Sistema.',
      );
    }

    return true;
  }
}
