import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Task } from '../../tasks/entities/task.entity';

@ObjectType()
export class ColumnMetric {
  @Field()
  boardId: string;

  @Field()
  name: string;

  @Field(() => Int)
  count: number;

  @Field({ nullable: true })
  color?: string;
}

@ObjectType()
export class ProjectRisk {
  @Field()
  level: string;

  @Field(() => Int)
  score: number;

  @Field()
  message: string;

  @Field(() => Int)
  timeElapsedPercentage: number;

  @Field(() => Int)
  workCompletedPercentage: number;
}

@ObjectType()
export class DailyTaskCompletion {
  @Field()
  date: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class ProjectMetrics {
  @Field(() => Int)
  totalTasks: number;

  @Field(() => Int)
  completedTasks: number;

  @Field(() => Int)
  overdueTasksCount: number;

  @Field(() => Int)
  inReviewTasks: number;

  @Field(() => Int)
  activityLast7Days: number;

  @Field(() => [ColumnMetric])
  tasksByColumn: ColumnMetric[];

  @Field(() => [Task])
  overdueTasksList: Task[];

  @Field(() => [MemberWorkload])
  workload: MemberWorkload[];

  @Field(() => [ActivityTrend])
  activityTrend: ActivityTrend[];

  @Field(() => [DailySnapshotData])
  burndownData: DailySnapshotData[];

  @Field(() => ProjectRisk)
  projectRisk: ProjectRisk;

  @Field(() => [DailyTaskCompletion])
  dailyCompletions: DailyTaskCompletion[];
}

@ObjectType()
export class MemberWorkload {
  @Field()
  memberName: string;

  @Field(() => Int)
  todo: number;

  @Field(() => Int)
  inProgress: number;

  @Field(() => Int)
  inReview: number;

  @Field(() => Int)
  done: number;
}

@ObjectType()
export class ActivityTrend {
  @Field()
  date: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class DailySnapshotData {
  @Field()
  date: string;

  @Field(() => Int)
  totalTasks: number;

  @Field(() => Int)
  completedTasks: number;

  @Field(() => Int)
  todoTasks: number;

  @Field(() => Int)
  inProgressTasks: number;
}
