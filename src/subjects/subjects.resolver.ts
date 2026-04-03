import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { SubjectsService } from './subjects.service';
import { SubjectEntity } from './entities/subject.entity';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';

@Resolver(() => SubjectEntity)
export class SubjectsResolver {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Mutation(() => SubjectEntity)
  createSubject(@Args('input') createSubjectInput: CreateSubjectInput) {
    return this.subjectsService.create(createSubjectInput);
  }

  @Query(() => [SubjectEntity], { name: 'subjects' })
  findAll() {
    return this.subjectsService.findAll();
  }

  @Query(() => SubjectEntity, { name: 'subject' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.subjectsService.findOne(id);
  }

  @Mutation(() => SubjectEntity)
  updateSubject(@Args('input') updateSubjectInput: UpdateSubjectInput) {
    return this.subjectsService.update(
      updateSubjectInput.id,
      updateSubjectInput,
    );
  }

  @Mutation(() => SubjectEntity)
  removeSubject(@Args('id', { type: () => String }) id: string) {
    return this.subjectsService.remove(id);
  }
}
