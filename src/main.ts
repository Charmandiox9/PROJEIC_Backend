import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { GqlExceptionFilter } from './common/filters/gql-exception.filter';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 1. Configuración de CORS dinámica y robusta
  const allowedOrigins = [
    process.env.FRONTEND_URL, // Tu IP en Docker (http://172.16.13.101)
    'http://localhost:3000',  // Tu desarrollo local normal
    'http://127.0.0.1:3000',  // A veces Next.js resuelve a 127.0.0.1
    // Si algún día subes el frontend a Railway, agregas su URL aquí:
    // 'https://projeicfrontend-production.up.railway.app'
  ].filter((x): x is string => !!x); // Filtra los valores undefined

  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // Esencial si en algún momento usas cookies o sesiones seguras
  });

  // 2. Archivos estáticos
  const uploadPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadPath, {
    prefix: '/projeic/api/uploads/',
    index: false,
    fallthrough: false,
  });

  // 3. Prefijo global
  app.setGlobalPrefix('projeic/api');

  // 4. Pipes de validación
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

  // 5. Filtros globales
  app.useGlobalFilters(new GqlExceptionFilter());

  // 6. Arranque del puerto
  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  // 7. Logs conscientes del entorno
  const environment = process.env.NODE_ENV || 'development';
  const host = environment === 'production' && process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL 
    : `http://localhost:${port}`;

  console.log(`🌍 Entorno: ${environment}`);
  console.log(`🚀 API: ${host}/projeic/api`);
  console.log(`📊 GraphQL: ${host}/projeic/api/graphql`);
}

bootstrap();
