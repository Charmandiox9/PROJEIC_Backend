import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreateActivityLogInput {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
