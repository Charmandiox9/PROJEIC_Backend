import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubResolver } from './github.resolver';
import { GithubController } from './github.controller';

@Module({
  providers: [GithubResolver, GithubService],
  controllers: [GithubController],
  exports: [GithubService],
})
export class GithubModule { }
