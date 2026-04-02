import { Module } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersResolver } from './project-members.resolver';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [ProjectMembersResolver, ProjectMembersService],
})
export class ProjectMembersModule {}
