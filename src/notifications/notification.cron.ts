import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationCronService {
  private readonly logger = new Logger(NotificationCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanOldNotifications() {
    this.logger.log('Iniciando limpieza de notificaciones leídas antiguas...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      const result = await this.prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      this.logger.log(
        `Limpieza completada: ${result.count} notificaciones eliminadas.`,
      );
    } catch (error) {
      this.logger.error(
        'Error al limpiar notificaciones de la base de datos',
        error,
      );
    }
  }
}
