import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResultStatus } from '@prisma/client';
import { CreateExpectedResultInput } from './dto/create-expected-result.input';
import { UpdateResultStatusInput } from './dto/update-result-status.input';
import { BadRequestException } from '@nestjs/common';
import { ActivityEntity, ActivityAction } from '@prisma/client';

@Injectable()
export class ExpectedResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateExpectedResultInput) {
    const newResult = await this.prisma.expectedResult.create({
      data: {
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        ownerId: input.ownerId,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: newResult.projectId,
        userId: newResult.ownerId,
        action: ActivityAction.CREATED,
        entity: ActivityEntity.EXPECTED_RESULT,
        entityId: newResult.id,
        meta: { title: newResult.title },
      },
    });

    return newResult;
  }

  async findByProject(projectId: string) {
    const results = await this.prisma.expectedResult.findMany({
      where: { projectId },
      include: {
        owner: true,
        evidences: true,
        history: { orderBy: { createdAt: 'desc' } },
        tasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return results.map((result) => ({
      ...result,
      owner: {
        ...result.owner,
        userId: result.owner.id,
      },
    }));
  }

  async updateStatus(input: UpdateResultStatusInput, userId: string) {
    const {
      resultId,
      status,
      evidenceUrl,
      evidenceFileKey,
      evidenceType,
      reason,
    } = input;

    const result = await this.prisma.expectedResult.findUnique({
      where: { id: resultId },
      include: { evidences: true },
    });

    if (!result) throw new BadRequestException('Resultado no encontrado');
    const statusWeight: Record<ResultStatus, number> = {
      NOT_STARTED: 0,
      STARTED: 1,
      IN_REVIEW: 2,
      VALIDATED: 3,
      COMPLETED: 4,
    };

    const isAdvancing = statusWeight[status] > statusWeight[result.status];
    const isRegressing = statusWeight[status] < statusWeight[result.status];
    const isAddingNewEvidence = !!(evidenceUrl || evidenceFileKey);
    const requiresEvidence = ['IN_REVIEW', 'VALIDATED', 'COMPLETED'].includes(
      status,
    );

    if (isAdvancing && requiresEvidence && !isAddingNewEvidence) {
      throw new BadRequestException(
        'Para avanzar a este estado, es obligatorio adjuntar una nueva evidencia que respalde el progreso.',
      );
    }

    if (isRegressing && !reason) {
      throw new BadRequestException(
        'Para retroceder el estado, es obligatorio dar un motivo del cambio.',
      );
    }

    const progressMap: Record<ResultStatus, number> = {
      NOT_STARTED: 0,
      STARTED: 10,
      IN_REVIEW: 50,
      VALIDATED: 80,
      COMPLETED: 100,
    };

    const updatedResult = await this.prisma.$transaction(async (tx) => {
      if (isAddingNewEvidence) {
        await tx.evidence.create({
          data: {
            expectedResultId: resultId,
            type: evidenceType || 'UNKNOWN',
            url: evidenceUrl,
            fileKey: evidenceFileKey,
          },
        });

        if (status === result.status) {
          await tx.activityLog.create({
            data: {
              projectId: result.projectId,
              userId: userId,
              action: ActivityAction.UPDATED,
              entity: ActivityEntity.EXPECTED_RESULT,
              entityId: resultId,
              meta: { title: result.title, addedEvidence: true },
            },
          });
        }
      }

      if (status !== result.status) {
        await tx.statusLog.create({
          data: {
            expectedResultId: resultId,
            previousStatus: result.status,
            newStatus: status,
            reason: reason || (isAdvancing ? 'Avance de progreso' : null),
            userId: result.ownerId,
          },
        });

        await tx.activityLog.create({
          data: {
            projectId: result.projectId,
            userId: userId,
            action: ActivityAction.UPDATED,
            entity: ActivityEntity.EXPECTED_RESULT,
            entityId: resultId,
            meta: {
              title: result.title,
              previousStatus: result.status,
              newStatus: status,
            },
          },
        });
      }

      return tx.expectedResult.update({
        where: { id: resultId },
        data: {
          status,
          progress: progressMap[status],
        },
        include: {
          owner: true,
          evidences: true,
          history: true,
        },
      });
    });

    return {
      ...updatedResult,
      owner: {
        ...updatedResult.owner,
        userId: updatedResult.owner.id,
      },
    };
  }
}
