import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { NotificationType } from '@prisma/client';

registerEnumType(NotificationType, { name: 'NotificationType' });

@ObjectType()
export class NotificationEntity {
  @Field(() => ID)
  id: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  title: string;

  @Field({ nullable: true })
  message?: string;

  @Field()
  isRead: boolean;

  @Field(() => ID, {
    nullable: true,
    description: 'ID de la entidad relacionada (ej: projectId)',
  })
  entityId?: string;

  @Field()
  createdAt: Date;
}
