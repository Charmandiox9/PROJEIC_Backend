import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class MonthlyStat {
  @Field() month: string;
  @Field(() => Int) count: number;
}

@ObjectType()
export class GlobalStats {
  @Field(() => Int) totalUsers: number;
  @Field(() => Int) totalProfessors: number;
  @Field(() => Int) totalProjects: number;
  @Field(() => Int) activeSubjects: number;

  @Field(() => [MonthlyStat])
  projectsAdoption: MonthlyStat[];
}
