import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateExpectedResultInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  ownerId: string;
}
