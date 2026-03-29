import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsResolver } from './projects.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProjectsRepository } from './projects.repository';

@Module({
  imports: [PrismaModule],
  providers: [ProjectsResolver, ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
