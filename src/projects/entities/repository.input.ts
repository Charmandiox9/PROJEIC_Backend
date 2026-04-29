import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';

@InputType()
export class RepositoryInput {
  @Field()
  name: string;

  @Field()
  owner: string;

  @Field()
  repoName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  url?: string;
}
