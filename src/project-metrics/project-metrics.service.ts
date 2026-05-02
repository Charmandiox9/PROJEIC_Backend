import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskStatus } from '@prisma/client';
import { TransactionType } from '@prisma/client';

@Injectable()
export class ProjectMetricsService {
  constructor(private prisma: PrismaService) {}

  // ... (getProjectTimeline y getDailyCompletions se quedan igual)

  async getProjectFinancialMetrics(projectId: string) {
    const wallet = await this.prisma.projectWallet.findUnique({
      where: { projectId },
      include: {
        transactions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!wallet) return null;

    // 1. Distribución de Gastos
    const expenseMap: Record<string, { type: string; name: string; color: string; amount: number }> = {
      PAYROLL: { type: 'PAYROLL', name: 'Pago de Planillas', color: '#3B82F6', amount: 0 },
      EXPENSE: { type: 'EXPENSE', name: 'Infraestructura', color: '#8B5CF6', amount: 0 },
      PENALTY: { type: 'PENALTY', name: 'Multas', color: '#EF4444', amount: 0 },
    };

    wallet.transactions.forEach((tx) => {
      if (tx.amount < 0 && expenseMap[tx.type]) {
        expenseMap[tx.type].amount += Math.abs(tx.amount);
      }
    });

    const trendMap = new Map<string, { balance: number; spent: number }>();
    let runningBalance = 0;

    wallet.transactions.forEach((tx) => {
      const date = tx.createdAt.toISOString().split('T')[0];
      runningBalance += tx.amount;

      if (!trendMap.has(date)) {
        trendMap.set(date, { balance: runningBalance, spent: 0 });
      } else {
        trendMap.get(date)!.balance = runningBalance;
      }

      if (tx.amount < 0) {
        trendMap.get(date)!.spent += Math.abs(tx.amount);
      }
    });

    const financialTrend = Array.from(trendMap.entries()).map(
      ([date, data]) => ({
        date,
        balance: data.balance,
        spent: data.spent,
      }),
    );

    return {
      currentBalance: wallet.balance,
      totalSpent: Object.values(expenseMap).reduce(
        (acc, curr) => acc + curr.amount,
        0,
      ),
      expensesByType: Object.values(expenseMap).filter((e) => e.amount > 0),
      financialTrend,
    };
  }
}
