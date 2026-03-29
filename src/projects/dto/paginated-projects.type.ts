import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Project } from '@prisma/client';
import { ProjectEntity } from '../entities/project.entity';

@ObjectType({ description: 'Paginated list of projects' })
export class PaginatedProjects {
  @Field(() => [ProjectEntity], { description: 'Current page items' })
  items: Project[]; // runtime type es Project de Prisma; GraphQL lo serializa como ProjectEntity

  @Field(() => Int, { description: 'Total count (ignoring pagination)' })
  total: number;

  @Field(() => Int, { description: 'Current offset' })
  skip: number;

  @Field(() => Int, { description: 'Page size used' })
  take: number;
}
