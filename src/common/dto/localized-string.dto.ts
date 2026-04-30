import { ObjectType, InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional } from 'class-validator';

@ObjectType('LocalizedString')
@InputType('LocalizedStringInput')
export class LocalizedStringDto {
  @Field()
  @IsString()
  es: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  en?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  pt?: string;
}
