import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getGlobalStats() {
    const totalUsers = await this.prisma.user.count();

    const totalProfessors = await this.prisma.user.count({
      where: {
        OR: [
          { email: { endsWith: '@ucn.cl' } },
          { email: { endsWith: '@ce.ucn.cl' } },
        ],
      },
    });

    const totalProjects = await this.prisma.project.count();

    const settings = await this.prisma.systemSetting.findUnique({
      where: { id: 'global' },
    });

    const activeSubjects = await this.prisma.subject.count({
      where: { period: settings?.activePeriod || '2026-10' },
    });

    const projectsThisYear = await this.prisma.project.findMany({
      where: { createdAt: { gte: new Date(new Date().getFullYear(), 0, 1) } },
      select: { createdAt: true },
    });

    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const adoptionMap = new Map<string, number>();

    const currentMonth = new Date().getMonth();
    for (let i = 0; i <= currentMonth; i++) {
      adoptionMap.set(monthNames[i], 0);
    }

    projectsThisYear.forEach((project) => {
      const monthIndex = project.createdAt.getMonth();
      const monthName = monthNames[monthIndex];
      if (adoptionMap.has(monthName)) {
        adoptionMap.set(monthName, adoptionMap.get(monthName)! + 1);
      }
    });

    const projectsAdoption = Array.from(adoptionMap.entries()).map(
      ([month, count]) => ({
        month,
        count,
      }),
    );

    return {
      totalUsers,
      totalProfessors,
      totalProjects,
      activeSubjects,
      projectsAdoption,
    };
  }

  async getUsers(skip: number, take: number, search?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as any } },
            { email: { contains: search, mode: 'insensitive' as any } },
          ],
        }
      : {};

    const [items, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, totalCount };
  }

  async updateUserRole(userId: string, isAdmin: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
    });
  }

  async disableUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const subjects = await this.prisma.subject.findMany({
      where: { professors: { some: { id: userId } }, period: '2026-10' },
    });

    if (subjects.length > 0) {
      throw new Error(
        'No se puede desactivar a un usuario que tiene asignaturas asignadas',
      );
    }

    user.isActive = false;

    return this.prisma.user.update({ where: { id: userId }, data: user });
  }

  async getAllProjects(skip: number, take: number, search?: string) {
    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' as any },
        }
      : {};

    const [items, totalCount] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          members: {
            where: { role: 'LEADER' },
            include: { user: true },
          },
          subject: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    const formattedItems = items.map((item) => {
      const { members, ...rest } = item;
      return {
        ...rest,
        owner: members[0]?.user || null,
      };
    });

    return { items: formattedItems, total: totalCount };
  }

  async getProjectFullDetails(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: { user: true },
        },
        subject: {
          include: { professors: true },
        },
        repositories: true,
        wallet: true,
        documents: true,
      },
    });
  }

  async forceDeleteProject(projectId: string) {
    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  async getSystemSettings() {
    return await this.prisma.systemSetting.upsert({
      where: { id: 'global' },
      update: {}, // No actualizamos nada si ya existe
      create: {
        id: 'global',
        activePeriod: '2026-1', // Valores iniciales
        allowNewProjects: true,
        maintenanceMode: false,
      },
    });
  }

  async updateSystemSettings(
    adminId: string,
    data: {
      activePeriod?: string;
      allowNewProjects?: boolean;
      maintenanceMode?: boolean;
    },
  ) {
    const updated = await this.prisma.systemSetting.update({
      where: { id: 'global' },
      data,
    });

    // 🔥 Registramos en el log que el admin cambió la configuración
    await this.logSystemAction(
      adminId,
      'UPDATE_SETTINGS',
      `Se actualizó la configuración global. Nuevo periodo: ${updated.activePeriod}`,
    );
    return updated;
  }

  // --- ANUNCIOS ---
  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAnnouncement(
    adminId: string,
    data: { title: string; message: string; type: string },
  ) {
    const announcement = await this.prisma.announcement.create({ data });
    await this.logSystemAction(
      adminId,
      'CREATE_ANNOUNCEMENT',
      `Anuncio creado: ${data.title}`,
    );
    return announcement;
  }

  async toggleAnnouncement(adminId: string, id: string, isActive: boolean) {
    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { isActive },
    });
    await this.logSystemAction(
      adminId,
      'TOGGLE_ANNOUNCEMENT',
      `Anuncio ${id} cambiado a estado: ${isActive}`,
    );
    return updated;
  }

  // --- AUDITORÍA DE SISTEMA ---
  async logSystemAction(userId: string, action: string, details: string) {
    return this.prisma.systemAuditLog.create({
      data: { userId, action, details },
    });
  }
}
