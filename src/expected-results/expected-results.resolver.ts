import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ExpectedResultsService } from './expected-results.service';
import { ExpectedResultEntity } from './entities/expected-result.entity';
import { CreateExpectedResultInput } from './dto/create-expected-result.input';
import { UpdateResultStatusInput } from './dto/update-result-status.input';

@Resolver(() => ExpectedResultEntity)
export class ExpectedResultsResolver {
  constructor(
    private readonly expectedResultsService: ExpectedResultsService,
  ) {}

  @Mutation(() => ExpectedResultEntity)
  createExpectedResult(@Args('input') input: CreateExpectedResultInput) {
    return this.expectedResultsService.create(input);
  }

  @Query(() => [ExpectedResultEntity], { name: 'expectedResultsByProject' })
  findByProject(@Args('projectId') projectId: string) {
    return this.expectedResultsService.findByProject(projectId);
  }

  @Mutation(() => ExpectedResultEntity)
  updateResultStatus(@Args('input') input: UpdateResultStatusInput) {
    return this.expectedResultsService.updateStatus(input);
  }
}
