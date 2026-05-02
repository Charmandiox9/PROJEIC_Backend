import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceResolver } from './finance.resolver';
import { FinanceCronService } from './finance.cron';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [FinanceResolver, FinanceService, FinanceCronService],
})
export class FinanceModule {}
