import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { ResultStatus } from '@prisma/client';
import { User } from '../../auth/entities/auth.entity';
import { Task } from '../../tasks/entities/task.entity';

@ObjectType('Evidence')
export class EvidenceEntity {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  url?: string;

  @Field({ nullable: true })
  fileKey?: string;

  @Field()
  createdAt: Date;
}

@ObjectType('ExpectedResult')
export class ExpectedResultEntity {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ResultStatus)
  status: ResultStatus;

  @Field(() => Int)
  progress: number;

  @Field()
  projectId: string;

  @Field()
  ownerId: string;

  @Field(() => User)
  owner: User;

  @Field(() => [EvidenceEntity], { nullable: 'itemsAndList' })
  evidences?: EvidenceEntity[];

  @Field(() => [StatusLogEntity], { nullable: 'itemsAndList' })
  history?: StatusLogEntity[];

  @Field(() => [Task], { nullable: 'itemsAndList' })
  tasks?: Task[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType('StatusLog')
export class StatusLogEntity {
  @Field(() => ID)
  id: string;

  @Field()
  previousStatus: string;

  @Field()
  newStatus: string;

  @Field({ nullable: true })
  reason?: string;

  @Field()
  createdAt: Date;
}

@ObjectType('ResultTask')
export class ResultTaskEntity {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  status: string;

  // Puedes agregar el assignee aquí después si lo necesitas
}
