import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
  expectedResultId?: string;
}
