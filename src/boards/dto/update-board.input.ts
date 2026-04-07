import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

@InputType()
export class UpdateBoardInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

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
