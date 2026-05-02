import { ObjectType, Field, ID, InputType, Float } from '@nestjs/graphql';
import { PublicUser } from '../../projects/entities/project.entity';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { CostCycle } from '../../finance/entities/finance.entity';

@ObjectType()
export class SubjectEntity {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  code?: string;

  @Field()
  period: string;

  @Field(() => [PublicUser], { nullable: true })
  professors?: PublicUser[];
}

@ObjectType()
export class CatalogItemEntity {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => Float) basePrice: number;
  @Field(() => CostCycle) cycle: CostCycle;
}

@InputType()
export class CreateCatalogItemInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  basePrice: number;

  @Field(() => CostCycle)
  @IsEnum(CostCycle)
  cycle: CostCycle;
}
