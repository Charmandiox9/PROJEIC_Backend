import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async countStudentsRegistered() {
    return this.prisma.user.count({
      where: {
        email: {
          endsWith: '@alumnos.ucn.cl',
        },
      },
    });
  }

  async countProfessorsRegistered() {
    return this.prisma.user.count({
      where: {
        OR: [
          { email: { endsWith: '@ucn.cl' } },
          { email: { endsWith: '@ce.ucn.cl' } },
          { email: { endsWith: '@cs.ucn.cl' } },
        ],
      },
    });
  }

  async countExternalProfessorsRegistered() {
    return this.prisma.user.count({
      where: {
        NOT: [
          { email: { endsWith: '@ucn.cl' } },
          { email: { endsWith: '@ce.ucn.cl' } },
          { email: { endsWith: '@alumnos.ucn.cl' } },
        ],
      },
    });
  }
}
