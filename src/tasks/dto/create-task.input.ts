import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus, TaskPriority } from '@prisma/client';

@InputType()
export class CreateTaskInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  priority?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  expectedResultId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  boardId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sprintId?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  tags?: string[];
}
