import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { NotificationEntity } from './entities/notification.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(GqlAuthGuard)
@Resolver(() => NotificationEntity)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [NotificationEntity], { name: 'myNotifications' })
  getMyNotifications(
    @CurrentUser() user: any,
    @Args('unreadOnly', { type: () => Boolean, defaultValue: false })
    unreadOnly: boolean,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.notificationsService.getUserNotifications(userId, unreadOnly);
  }

  @Mutation(() => NotificationEntity)
  markNotificationAsRead(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ) {
    const userId = user.id || user.userId || user.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Mutation(() => Boolean)
  markAllNotificationsAsRead(@CurrentUser() user: any) {
    const userId = user.id || user.userId || user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }
}
