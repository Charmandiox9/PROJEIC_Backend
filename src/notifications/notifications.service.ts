import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // ─── USO INTERNO DEL SISTEMA (No expuesto en GraphQL) ───────────────

  async createSystemNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message?: string;
    entityId?: string;
  }) {
    return this.prisma.notification.create({
      data,
    });
  }

  // ─── USO DEL USUARIO (Expuesto en GraphQL) ──────────────────────────

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    return this.prisma.notification.findMany({
      where: {
        userId: userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: userId, isRead: false },
      data: { isRead: true },
    });
    return result.count > 0;
  }
}
