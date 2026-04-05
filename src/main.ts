import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { GqlExceptionFilter } from './common/filters/gql-exception.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });

  const uploadPath = join(process.cwd(), 'uploads');

  app.useStaticAssets(uploadPath, {
    prefix: '/projeic/api/uploads/',
    index: false,
    fallthrough: false,
  });

  app.setGlobalPrefix('projeic/api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        console.log(errors);
        return new BadRequestException(errors);
      },
    }),
  );

  app.useGlobalFilters(new GqlExceptionFilter());

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`🚀 API: http://localhost:${port}/projeic/api`);
  console.log(`📊 GraphQL: http://localhost:${port}/projeic/api/graphql`);
}

bootstrap();
