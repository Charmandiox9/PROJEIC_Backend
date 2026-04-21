import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppResolver } from './app.resolver';
import { AuthModule } from './auth/auth.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { GoogleStrategy } from './auth/strategies/google.strategy';
import { JwtStrategy } from './auth/strategies/wt.strategy';
import { ProjectsModule } from './projects/projects.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { NotificationsModule } from './notifications/notifications.module';
import { SubjectsModule } from './subjects/subjects.module';
import { UploadsModule } from './uploads/uploads.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ExpectedResultsModule } from './expected-results/expected-results.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { BoardsModule } from './boards/boards.module';
import { ProjectMetricsModule } from './project-metrics/project-metrics.module';
import { SprintsModule } from './sprints/sprints.module';
import { StorageModule } from './storage/storage.module';
import { S3Module } from './s3/s3.module';
import { EvidenceModule } from './evidence/evidence.module';
import { GithubModule } from './github/github.module';

const devProviders =
  process.env.NODE_ENV !== 'production'
    ? [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }]
    : [];
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: '/projeic/api/graphql',
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    AuthModule,
    PrismaModule,
    ProjectsModule,
    ProjectMembersModule,
    NotificationsModule,
    SubjectsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/projeic/api/uploads',
    }),
    UploadsModule,
    ExpectedResultsModule,
    TasksModule,
    UsersModule,
    ActivityLogsModule,
    BoardsModule,
    ProjectMetricsModule,
    SprintsModule,
    StorageModule,
    S3Module,
    EvidenceModule,
    GithubModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    GoogleStrategy,
    JwtStrategy,
    ...devProviders,
  ],
})
export class AppModule {}
