import { Module } from '@nestjs/common';
import { ProjectMembersService } from './project-members.service';
import { ProjectMembersResolver } from './project-members.resolver';

@Module({
  providers: [ProjectMembersResolver, ProjectMembersService],
})
export class ProjectMembersModule {}
