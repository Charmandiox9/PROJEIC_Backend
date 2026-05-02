import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectEntity } from './entities/subject.entity';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import {
  CatalogItemEntity,
  CreateCatalogItemInput,
} from './entities/subject.entity';
import { PrismaService } from 'src/prisma/prisma.service';

@Resolver(() => SubjectEntity)
export class SubjectsResolver {
  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Query(() => Int)
  async countSemesters() {
    return this.subjectsService.countSemesters();
  }

  @Query(() => Int)
  async countSubjects() {
    return this.subjectsService.countSubjects();
  }

  @Query(() => [SubjectEntity])
  @UseGuards(GqlAuthGuard)
  async getMyTaughtSubjects(@CurrentUser() user: any) {
    const userId = user.id || user.userId;
    return this.subjectsService.myTaughtSubjects(userId);
  }

  @Mutation(() => CatalogItemEntity)
  @UseGuards(GqlAuthGuard)
  async createCatalogItem(@Args('input') input: CreateCatalogItemInput) {
    return this.prisma.catalogItem.create({
      data: {
        subjectId: input.subjectId,
        name: input.name,
        description: input.description,
        basePrice: input.basePrice,
        cycle: input.cycle,
      },
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteCatalogItem(@Args('id') id: string) {
    await this.prisma.catalogItem.delete({ where: { id } });
    return true;
  }

  @Query(() => [CatalogItemEntity])
  @UseGuards(GqlAuthGuard)
  async getSubjectCatalog(@Args('subjectId') subjectId: string) {
    return this.prisma.catalogItem.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
