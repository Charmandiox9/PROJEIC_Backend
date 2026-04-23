import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => Int)
  async countStudentsRegistered() {
    return this.usersService.countStudentsRegistered();
  }

  @Query(() => Int)
  async countProfessorsRegistered() {
    return this.usersService.countProfessorsRegistered();
  }

  @Query(() => Int)
  async countExternalProfessorsRegistered() {
    return this.usersService.countExternalProfessorsRegistered();
  }
}
