import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { GlobalStats } from './entities/global-stats.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminUser, PaginatedUsers } from './entities/admin-user.entity';
import { PaginatedProjects } from 'src/projects/dto/paginated-projects.type';
import { ProjectEntity } from 'src/projects/entities/project.entity';
import { PublicUser } from 'src/projects/entities/project.entity';
import { AnnouncementEntity } from './entities/announcement.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SystemSettingEntity } from './entities/system-setting.entity';

@Resolver()
@UseGuards(GqlAuthGuard, AdminGuard)
export class AdminResolver {
  constructor(private readonly adminService: AdminService) {}

  @Query(() => GlobalStats, { name: 'getGlobalStats' })
  async getGlobalStats() {
    return this.adminService.getGlobalStats();
  }

  @Query(() => PaginatedUsers, { name: 'adminGetUsers' })
  async getUsers(
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('take', { type: () => Int, defaultValue: 10 }) take: number,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ) {
    return this.adminService.getUsers(skip, take, search);
  }

  @Mutation(() => AdminUser)
  async adminUpdateUserRole(
    @Args('userId') userId: string,
    @Args('isAdmin') isAdmin: boolean,
  ) {
    return this.adminService.updateUserRole(userId, isAdmin);
  }

  @Mutation(() => AdminUser)
  async adminDisableUser(@Args('userId') userId: string) {
    return this.adminService.disableUser(userId);
  }

  @Query(() => PaginatedProjects, { name: 'adminGetProjects' })
  async getProjects(
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('take', { type: () => Int, defaultValue: 10 }) take: number,
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('active', { type: () => Boolean, nullable: true }) active?: boolean,
  ) {
    return this.adminService.getAllProjects(skip, take, search);
  }

  @Mutation(() => ProjectEntity)
  async adminForceDeleteProject(@Args('projectId') projectId: string) {
    return this.adminService.forceDeleteProject(projectId);
  }

  @Query(() => ProjectEntity, { name: 'adminGetProjectDetails' })
  async adminGetProjectDetails(@Args('id', { type: () => String }) id: string) {
    return this.adminService.getProjectFullDetails(id);
  }

  @Query(() => SystemSettingEntity)
  @UseGuards(GqlAuthGuard, AdminGuard)
  async adminGetSettings() {
    return this.adminService.getSystemSettings();
  }

  @Mutation(() => SystemSettingEntity)
  @UseGuards(GqlAuthGuard, AdminGuard)
  async adminUpdateSettings(
    @CurrentUser() admin: PublicUser, // Asumiendo que así obtienes al usuario actual
    @Args('activePeriod', { nullable: true }) activePeriod?: string,
    @Args('allowNewProjects', { nullable: true }) allowNewProjects?: boolean,
    @Args('maintenanceMode', { nullable: true }) maintenanceMode?: boolean,
  ) {
    return this.adminService.updateSystemSettings(admin.id, {
      activePeriod,
      allowNewProjects,
      maintenanceMode,
    });
  }

  @Query(() => [AnnouncementEntity])
  @UseGuards(GqlAuthGuard, AdminGuard)
  async adminGetAnnouncements() {
    return this.adminService.getAnnouncements();
  }

  @Mutation(() => AnnouncementEntity)
  @UseGuards(GqlAuthGuard, AdminGuard)
  async adminCreateAnnouncement(
    @CurrentUser() admin: PublicUser,
    @Args('title') title: string,
    @Args('message') message: string,
    @Args('type', { defaultValue: 'INFO' }) type: string,
  ) {
    return this.adminService.createAnnouncement(admin.id, {
      title,
      message,
      type,
    });
  }

  @Mutation(() => AnnouncementEntity)
  @UseGuards(GqlAuthGuard, AdminGuard)
  async adminToggleAnnouncement(
    @CurrentUser() admin: PublicUser,
    @Args('id') id: string,
    @Args('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleAnnouncement(admin.id, id, isActive);
  }
}
