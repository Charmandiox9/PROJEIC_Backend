import { Resolver, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { User } from './entities/auth.entity';

@Resolver(() => User)
export class AuthResolver {
  @UseGuards(GqlAuthGuard)
  @Query(() => User, { name: 'me' })
  getProfile(@Context() context: any) {
    return context.req.user;
  }
}
