import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { User } from 'src/auth/entities/auth.entity';

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
  startDate?: Date;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field()
  projectId: string;

  @Field()
  creatorId: string;

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

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => [CommentEntity], { nullable: true })
  comments?: CommentEntity[];
}

@ObjectType()
export class CommentEntity {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  taskId: string;

  @Field()
  authorId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  author?: User;

  @Field(() => Task, { nullable: true })
  task?: Task;
}
