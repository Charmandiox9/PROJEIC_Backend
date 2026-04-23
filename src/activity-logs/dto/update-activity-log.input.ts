import { CreateActivityLogInput } from './create-activity-log.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateActivityLogInput extends PartialType(CreateActivityLogInput) {
  @Field(() => Int)
  id: number;
}
