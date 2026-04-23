import { Module, forwardRef } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsResolver } from './projects.resolver';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProjectsRepository } from './projects.repository';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { BoardsModule } from 'src/boards/boards.module';
import { ProjectMembersModule } from 'src/project-members/project-members.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    EmailModule,
    BoardsModule,
    forwardRef(() => ProjectMembersModule),
  ],
  providers: [ProjectsResolver, ProjectsService, ProjectsRepository],
  exports: [ProjectsService],
})
export class ProjectsModule {}
