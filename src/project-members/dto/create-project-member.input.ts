import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateProjectMemberInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
