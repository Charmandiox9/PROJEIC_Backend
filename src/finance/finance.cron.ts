import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class FinanceCronService {
  private readonly logger = new Logger(FinanceCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringCosts() {
    this.logger.log('Iniciando cobro automático de infraestructura...');

    const activeCosts = await this.prisma.projectCost.findMany({
      where: { isActive: true },
      include: { wallet: true },
    });

    for (const cost of activeCosts) {
      const today = new Date();
      const isFirstDayOfMonth = today.getDate() === 1;
      const isMonday = today.getDay() === 1;

      const shouldCharge =
        (cost.cycle === 'MONTHLY' && isFirstDayOfMonth) ||
        (cost.cycle === 'WEEKLY' && isMonday);

      if (shouldCharge) {
        await this.prisma.projectWallet.update({
          where: { id: cost.walletId },
          data: {
            balance: { decrement: cost.amount },
            transactions: {
              create: {
                amount: -cost.amount,
                type: TransactionType.EXPENSE,
                description: `Cobro automático: ${cost.name}`,
                executorId: 'SYSTEM',
              },
            },
          },
        });
        this.logger.log(
          `Cobrado $${cost.amount} al wallet ${cost.walletId} por ${cost.name}`,
        );
      }
    }
  }
}
