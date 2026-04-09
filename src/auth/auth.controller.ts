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

    let frontendUrl = this.configService.get<string>('FRONTEND_URL');

    // LOG DE DEBUG PARA RAILWAY
    console.log('DEBUG BACKEND - FRONTEND_URL de ConfigService:', frontendUrl);
    console.log(
      'DEBUG BACKEND - RAILWAY_ENVIRONMENT:',
      process.env.RAILWAY_ENVIRONMENT,
    );

    if (!frontendUrl && process.env.RAILWAY_ENVIRONMENT) {
      frontendUrl = 'https://projeicfrontend-production.up.railway.app';
    } else if (!frontendUrl) {
      frontendUrl = 'http://localhost:3000';
    }

    const redirectPath = `${frontendUrl}/projeic/auth/success?token=${jwt.accessToken}`;
    console.log('DEBUG BACKEND - Redirigiendo a:', redirectPath);

    res.redirect(redirectPath);
  }
}
