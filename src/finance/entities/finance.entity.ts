import {
  ObjectType,
  Field,
  Float,
  registerEnumType,
  InputType,
} from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
} from 'class-validator';

export enum TransactionType {
  FUNDING = 'FUNDING',
  PAYROLL = 'PAYROLL',
  EXPENSE = 'EXPENSE',
  PENALTY = 'PENALTY',
  REFUND = 'REFUND',
}
registerEnumType(TransactionType, { name: 'TransactionType' });

export enum CostCycle {
  ONE_TIME = 'ONE_TIME',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}
registerEnumType(CostCycle, { name: 'CostCycle' });

@ObjectType()
export class Transaction {
  @Field() id: string;
  @Field(() => Float) amount: number;
  @Field(() => TransactionType) type: TransactionType;
  @Field() description: string;
  @Field() walletId: string;
  @Field() executorId: string;
  @Field({ nullable: true }) recipientId?: string;
  @Field(() => Date) createdAt: Date;
}

@ObjectType()
export class ProjectCost {
  @Field() id: string;
  @Field() name: string;
  @Field(() => Float) amount: number;
  @Field(() => CostCycle) cycle: CostCycle;
  @Field() isActive: boolean;
}

@ObjectType()
export class ProjectWallet {
  @Field() id: string;
  @Field(() => Float) balance: number;
  @Field() currency: string;
  @Field() projectId: string;

  @Field(() => [Transaction], { nullable: 'itemsAndList' })
  transactions?: Transaction[];

  @Field(() => [ProjectCost], { nullable: 'itemsAndList' })
  costs?: ProjectCost[];
}

@InputType()
export class FundProjectInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}

@InputType()
export class PayMemberInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}

@InputType()
export class SubscribeCatalogInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  catalogItemId: string;
}

@InputType()
export class ApplyPenaltyInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  reason: string;
}

@InputType()
export class CancelSubscriptionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  costId: string;
}
