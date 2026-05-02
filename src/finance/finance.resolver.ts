import { Resolver, Mutation, Args, Query, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  FundProjectInput,
  ProjectWallet,
  PayMemberInput,
  ApplyPenaltyInput,
  SubscribeCatalogInput,
  CancelSubscriptionInput,
} from './entities/finance.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjectRole } from '@prisma/client';

@Resolver()
@UseGuards(GqlAuthGuard)
export class FinanceResolver {
  constructor(private readonly financeService: FinanceService) {}

  @Mutation(() => ProjectWallet)
  @Roles(ProjectRole.SUPERVISOR)
  async fundProject(
    @Args('input') input: FundProjectInput,
    @CurrentUser() user: any,
  ) {
    return this.financeService.fundProject(input, user.userId);
  }

  @Mutation(() => ProjectWallet)
  @Roles(ProjectRole.LEADER)
  async payMember(
    @Args('input') input: PayMemberInput,
    @CurrentUser() user: any,
  ) {
    const currentUserId = user.id || user.userId;
    return this.financeService.payMember(input, currentUserId);
  }

  @Query(() => Float)
  async getMyProjectEarnings(
    @Args('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    const currentUserId = user.id || user.userId;
    return this.financeService.getMyEarnings(projectId, currentUserId);
  }

  @Mutation(() => ProjectWallet)
  @Roles(ProjectRole.SUPERVISOR)
  async subscribeCatalog(
    @Args('input') input: SubscribeCatalogInput,
    @CurrentUser() user: any,
  ) {
    return this.financeService.subscribeToCatalogItem(input, user.userId);
  }

  @Mutation(() => ProjectWallet)
  @Roles(ProjectRole.SUPERVISOR)
  async applyPenalty(
    @Args('input') input: ApplyPenaltyInput,
    @CurrentUser() user: any,
  ) {
    return this.financeService.applyPenalty(input, user.userId);
  }

  @Mutation(() => Boolean)
  @Roles(ProjectRole.SUPERVISOR)
  async cancelSubscription(
    @Args('input') input: CancelSubscriptionInput,
    @CurrentUser() user: any,
  ) {
    const currentUserId = user.id || user.userId;
    return this.financeService.cancelSubscription(input, currentUserId);
  }
}
