import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const jwt = await this.authService.login(req.user);

    // Intenta obtener la variable del panel de Railway
    let frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // Si no existe, pero detectamos que estamos en producción (RAILWAY_PUBLIC_DOMAIN es inyectada por Railway)
    if (!frontendUrl && process.env.RAILWAY_ENVIRONMENT) {
      frontendUrl = 'https://projeicfrontend-production.up.railway.app';
    } else if (!frontendUrl) {
      frontendUrl = 'http://localhost:3000';
    }

    res.redirect(
      `${frontendUrl}/projeic/auth/success?token=${jwt.accessToken}`,
    );
  }
}
