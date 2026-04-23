import { InputType, Field, ID, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDate,
  IsInt,
} from 'class-validator';

@InputType()
export class UpdateTaskInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  priority?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  position?: number;

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
  boardId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  sprintId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assigneeId?: string;
}
