import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

@InputType()
export class CreateBoardInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  position?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  color?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  wipLimit?: number;
}
