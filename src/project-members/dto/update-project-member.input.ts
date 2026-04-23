import { CreateProjectMemberInput } from './create-project-member.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateProjectMemberInput extends PartialType(CreateProjectMemberInput) {
  @Field(() => Int)
  id: number;
}
