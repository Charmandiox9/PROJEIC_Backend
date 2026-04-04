import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ResultStatus } from '@prisma/client';

@InputType()
export class UpdateResultStatusInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  resultId: string;

  @Field(() => ResultStatus)
  @IsEnum(ResultStatus)
  status: ResultStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  reason?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  evidenceUrl?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  evidenceFileKey?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  evidenceType?: string;
}
