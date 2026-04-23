import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateSubjectInput {
  @Field()
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  code?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  period: string;

  @Field(() => [String], { description: 'IDs de los profesores' })
  @IsArray()
  @IsString({ each: true })
  professorIds: string[];
}
