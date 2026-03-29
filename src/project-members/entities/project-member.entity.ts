import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ProjectMember {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
