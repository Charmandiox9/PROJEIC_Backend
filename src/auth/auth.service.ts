import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: any) {
    if (!user) {
      throw new Error('No se recibió información del usuario desde Google');
    }

    let userDB = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!userDB) {
      userDB = await this.prisma.user.create({
        data: {
          googleId: user.googleId,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          avatarUrl: user.picture,
        },
      });
    }

    const payload = {
      email: userDB.email,
      sub: userDB.id,
      name: userDB.name,
      avatar: userDB.avatarUrl,
      isAdmin: userDB.isAdmin,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
