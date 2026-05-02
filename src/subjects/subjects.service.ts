import { Injectable } from '@nestjs/common';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  @UseGuards(GqlAuthGuard, AdminGuard)
  async create(input: CreateSubjectInput) {
    return this.prisma.subject.create({
      data: {
        name: input.name,
        code: input.code,
        period: input.period,
        professors: {
          connect: input.professorIds.map((id) => ({ id })),
        },
      },
      include: { professors: true },
    });
  }

  async findAll() {
    return this.prisma.subject.findMany({
      include: { professors: true },
      orderBy: { period: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.subject.findUnique({
      where: { id },
      include: { professors: true },
    });
  }

  @UseGuards(GqlAuthGuard, AdminGuard)
  async update(id: string, updateSubjectInput: UpdateSubjectInput) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        name: updateSubjectInput.name,
        code: updateSubjectInput.code,
        period: updateSubjectInput.period,
        professors: updateSubjectInput.professorIds
          ? {
              set: updateSubjectInput.professorIds.map((profId) => ({
                id: profId,
              })),
            }
          : undefined,
      },
      include: { professors: true },
    });
  }

  @UseGuards(GqlAuthGuard, AdminGuard)
  async remove(id: string) {
    return this.prisma.subject.delete({
      where: { id },
    });
  }

  async countSemesters() {
    const result = await this.prisma.subject.findMany({
      distinct: ['period'],
      select: { period: true },
    });
    return result.length;
  }

  async countSubjects() {
    return this.prisma.subject.count();
  }

  async myTaughtSubjects(userId: string) {
    return this.prisma.subject.findMany({
      where: {
        professors: {
          some: { id: userId },
        },
      },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });
  }
}
