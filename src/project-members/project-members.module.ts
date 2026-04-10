import { Module, forwardRef } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersResolver } from './project-members.resolver';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  imports: [NotificationsModule, forwardRef(() => ProjectsModule)],
  providers: [ProjectMembersResolver, ProjectMembersService],
  exports: [ProjectMembersService],
})
export class ProjectMembersModule {}
