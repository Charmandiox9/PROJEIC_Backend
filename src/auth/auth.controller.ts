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

    // 1. Buscamos la URL explícita (Útil para Railway donde Front y Back son dominios distintos)
    let frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      process.env.FRONTEND_URL;

    // 2. Si no hay variable definida, inferimos inteligentemente según el entorno
    if (!frontendUrl) {
      if (process.env.NODE_ENV === 'production') {
        // En Producción (Docker), Nginx unifica todo.
        // Usar un string vacío generará una redirección relativa (ej: /projeic/auth/success)
        // El navegador mantendrá automáticamente la IP 172.16.13.101
        frontendUrl = '';
      } else {
        // En Desarrollo Local, Front (3000) y Back (4000) están separados
        frontendUrl = 'http://localhost:3000';
      }
    }

    // 3. Limpiamos comillas extrañas (Railway) y slashes finales
    const cleanFrontendUrl = frontendUrl
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\/$/, '');

    // 4. Armamos la ruta
    // Nota: Express es inteligente. Si cleanFrontendUrl es "", la ruta empieza con "/"
    // y hace un redirect relativo seguro.
    const redirectPath = `${cleanFrontendUrl}/projeic/auth/success?token=${jwt.accessToken}`;

    console.log(`[OAuth Debug] Entorno: ${process.env.NODE_ENV}`);
    console.log(`[OAuth Debug] Redirigiendo a: ${redirectPath}`);

    res.redirect(redirectPath);
  }
}
