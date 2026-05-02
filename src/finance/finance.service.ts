import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  Transaction,
  FundProjectInput,
  PayMemberInput,
  SubscribeCatalogInput,
  ApplyPenaltyInput,
  CancelSubscriptionInput,
} from './entities/finance.entity';
import { TransactionType } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async fundProject(input: FundProjectInput, executorId: string) {
    if (input.amount <= 0) {
      throw new BadRequestException('El monto de fondeo debe ser mayor a 0');
    }

    const wallet = await this.prisma.projectWallet.findUnique({
      where: { projectId: input.projectId },
    });

    if (!wallet) {
      throw new NotFoundException(
        'El proyecto no tiene una billetera inicializada',
      );
    }

    return this.prisma.projectWallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: input.amount,
        },
        transactions: {
          create: {
            amount: input.amount,
            type: TransactionType.FUNDING,
            description: input.description || 'Fondeo inicial del supervisor',
            executorId: executorId,
          },
        },
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  async payMember(input: PayMemberInput, executorId: string) {
    const wallet = await this.prisma.projectWallet.findUnique({
      where: { projectId: input.projectId },
    });

    if (!wallet) throw new NotFoundException('Billetera no encontrada');

    return this.prisma.projectWallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: input.amount,
        },
        transactions: {
          create: {
            amount: -input.amount,
            type: TransactionType.PAYROLL,
            description: input.description || 'Pago de honorarios / Planilla',
            executorId: executorId,
            recipientId: input.recipientId,
          },
        },
      },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getMyEarnings(projectId: string, userId: string) {
    const result = await this.prisma.transaction.aggregate({
      where: {
        wallet: { projectId: projectId },
        recipientId: userId,
        type: TransactionType.PAYROLL,
      },
      _sum: {
        amount: true,
      },
    });

    const total = result._sum.amount || 0;
    return Math.abs(total);
  }

  async subscribeToCatalogItem(
    input: SubscribeCatalogInput,
    executorId: string,
  ) {
    const wallet = await this.prisma.projectWallet.findUnique({
      where: { projectId: input.projectId },
    });
    const item = await this.prisma.catalogItem.findUnique({
      where: { id: input.catalogItemId },
    });

    if (!wallet || !item)
      throw new NotFoundException('Billetera o Item no encontrado');

    const costData =
      item.cycle !== 'ONE_TIME'
        ? {
            create: {
              name: item.name,
              amount: item.basePrice,
              cycle: item.cycle,
              catalogItemId: item.id,
            },
          }
        : undefined;

    return this.prisma.projectWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: item.basePrice },
        transactions: {
          create: {
            amount: -item.basePrice,
            type: 'EXPENSE',
            description: `Contratación: ${item.name}`,
            executorId: executorId,
          },
        },
        ...(costData && { costs: costData }),
      },
      include: {
        transactions: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async applyPenalty(input: ApplyPenaltyInput, executorId: string) {
    const wallet = await this.prisma.projectWallet.findUnique({
      where: { projectId: input.projectId },
    });
    if (!wallet) throw new NotFoundException('Billetera no encontrada');

    return this.prisma.projectWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: input.amount },
        transactions: {
          create: {
            amount: -input.amount,
            type: TransactionType.PENALTY,
            description: `MULTA: ${input.reason}`,
            executorId,
          },
        },
      },
    });
  }

  async cancelSubscription(input: CancelSubscriptionInput, executorId: string) {
    const wallet = await this.prisma.projectWallet.findUnique({
      where: { projectId: input.projectId },
    });
    if (!wallet) throw new NotFoundException('Billetera no encontrada');

    const cost = await this.prisma.projectCost.findFirst({
      where: { id: input.costId, walletId: wallet.id, isActive: true },
    });

    if (!cost)
      throw new NotFoundException(
        'Suscripción no encontrada o ya está inactiva',
      );

    await this.prisma.projectCost.update({
      where: { id: cost.id },
      data: { isActive: false },
    });

    return true;
  }
}
