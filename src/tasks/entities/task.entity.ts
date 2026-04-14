import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Task {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

  @Field()
  priority: string;

  @Field(() => Int)
  position: number;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field()
  projectId: string;

  @Field()
  creatorId: string;

  // ─── Relaciones Ágiles & Híbridas ───
  @Field({ nullable: true })
  expectedResultId?: string;

  @Field({ nullable: true })
  boardId?: string;

  @Field({ nullable: true })
  sprintId?: string;

  @Field({ nullable: true })
  assigneeId?: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
