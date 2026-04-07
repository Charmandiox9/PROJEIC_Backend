import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardInput } from './dto/create-board.input';
import { UpdateBoardInput } from './dto/update-board.input';
import { ActivityAction, ActivityEntity } from '@prisma/client';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async createDefaultBoards(projectId: string, userId: string) {
    const defaultBoards = [
      { name: 'Backlog', position: 0, color: '#9CA3AF' },
      { name: 'To Do', position: 1, color: '#3B82F6' },
      { name: 'In Progress', position: 2, color: '#F59E0B' },
      { name: 'Done', position: 3, color: '#10B981' },
    ];

    await this.prisma.board.createMany({
      data: defaultBoards.map((board) => ({
        ...board,
        projectId,
      })),
    });

    await this.prisma.activityLog.create({
      data: {
        projectId,
        userId,
        action: ActivityAction.CREATED,
        entity: ActivityEntity.BOARD,
        entityId: projectId,
        meta: { title: 'Columnas Kanban por defecto' },
      },
    });

    return this.findAllByProject(projectId);
  }

  async create(input: CreateBoardInput, userId: string) {
    let newPosition = input.position;
    if (newPosition === undefined) {
      const lastBoard = await this.prisma.board.findFirst({
        where: { projectId: input.projectId },
        orderBy: { position: 'desc' },
      });
      newPosition = lastBoard ? lastBoard.position + 1 : 0;
    }

    const newBoard = await this.prisma.board.create({
      data: {
        name: input.name,
        projectId: input.projectId,
        position: newPosition,
        color: input.color,
        wipLimit: input.wipLimit,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        projectId: newBoard.projectId,
        userId: userId,
        action: ActivityAction.CREATED,
        entity: ActivityEntity.BOARD,
        entityId: newBoard.id,
        meta: { title: newBoard.name },
      },
    });

    return newBoard;
  }

  async findAllByProject(projectId: string) {
    return this.prisma.board.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, input: UpdateBoardInput, userId: string) {
    const oldBoard = await this.prisma.board.findUnique({ where: { id } });
    if (!oldBoard) throw new NotFoundException('Columna no encontrada');

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.position !== undefined) updateData.position = input.position;
    if (input.color !== undefined) updateData.color = input.color;
    if (input.wipLimit !== undefined) updateData.wipLimit = input.wipLimit;

    const updatedBoard = await this.prisma.board.update({
      where: { id },
      data: updateData,
    });

    const changes: any = {};
    let hasChanges = false;

    if (input.name !== undefined && input.name !== oldBoard.name) {
      changes.name = { from: oldBoard.name, to: input.name };
      hasChanges = true;
    }
    if (input.wipLimit !== undefined && input.wipLimit !== oldBoard.wipLimit) {
      changes.wipLimit = {
        from: oldBoard.wipLimit || 'Sin límite',
        to: input.wipLimit || 'Sin límite',
      };
      hasChanges = true;
    }

    if (hasChanges) {
      await this.prisma.activityLog.create({
        data: {
          projectId: updatedBoard.projectId,
          userId: userId,
          action: ActivityAction.UPDATED,
          entity: ActivityEntity.BOARD,
          entityId: updatedBoard.id,
          meta: { title: updatedBoard.name, changes },
        },
      });
    }

    return updatedBoard;
  }

  async remove(id: string, userId: string) {
    const boardToDelete = await this.prisma.board.findUnique({ where: { id } });
    if (!boardToDelete) throw new NotFoundException('Columna no encontrada');

    await this.prisma.board.delete({ where: { id } });

    await this.prisma.activityLog.create({
      data: {
        projectId: boardToDelete.projectId,
        userId: userId,
        action: ActivityAction.DELETED,
        entity: ActivityEntity.BOARD,
        entityId: id,
        meta: { title: boardToDelete.name },
      },
    });

    return boardToDelete;
  }
}
