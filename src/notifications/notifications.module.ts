import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationCronService } from './notification.cron';

@Module({
  imports: [PrismaModule],
  providers: [
    NotificationsResolver,
    NotificationsService,
    NotificationCronService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
