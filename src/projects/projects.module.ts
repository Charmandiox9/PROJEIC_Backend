import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsResolver } from './projects.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProjectsRepository } from './projects.repository';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { BoardsModule } from 'src/boards/boards.module';

@Module({
  imports: [PrismaModule, NotificationsModule, BoardsModule],
  providers: [ProjectsResolver, ProjectsService, ProjectsRepository],
  exports: [ProjectsService],
})
export class ProjectsModule {}
