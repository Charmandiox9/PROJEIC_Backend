import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { GqlExceptionFilter } from './common/filters/gql-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
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

  await app.listen(process.env.PORT ?? 4000);
  console.log(`Application is running on: ${await app.getUrl()}/graphql`);
}

bootstrap();
