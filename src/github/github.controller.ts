import { Controller, Get, Param, Headers, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('artifacts/:owner/:repo/:id/download')
  async download(
    @Headers('authorization') authHeader: string,
    @Param('owner') owner: string,
    @Param('repo') repo: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const token = authHeader?.split(' ')[1];
    if (!token) throw new UnauthorizedException('Token requerido');

    try {
      const buffer = await this.githubService.downloadArtifact(token, owner, repo, id);
      
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="artifact-${id}.zip"`,
      });
      
      res.send(Buffer.from(buffer));
    } catch (error) {
      res.status(500).send('Error al descargar el archivo desde GitHub');
    }
  }
}