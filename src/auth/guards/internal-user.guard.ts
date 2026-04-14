import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InternalUserGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado.');
    }

    const userId = user.id || user.userId || user.sub;
    let email = user.email;

    if (!email) {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!dbUser) {
        throw new ForbiddenException('Usuario no encontrado.');
      }
      email = dbUser.email;
    }

    const emailDomain = email.split('@')[1];

    const allowedDomains = ['alumnos.ucn.cl', 'ce.ucn.cl', 'ucn.cl'];

    if (!allowedDomains.includes(emailDomain)) {
      throw new ForbiddenException(
        'Acceso denegado: Esta acción es exclusiva para miembros de la UCN.',
      );
    }

    return true;
  }
}
