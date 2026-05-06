import { CreateSubjectInput } from './create-subject.input';
import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator'; // 🔥 1. Importa esto

@InputType()
export class UpdateSubjectInput extends PartialType(CreateSubjectInput) {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;
}
