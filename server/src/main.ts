import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/business-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const configService = app.get(ConfigService);

  app.enableCors();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Lumax Service API')
      .setDescription('Lumax BFF 中台服务接口文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
  }

  const port = configService.get<number>('PORT', 9008);
  await app.listen(port);

  const server = app.getHttpServer();
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  console.log(`Lumax Service running on http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
  }
}

bootstrap();
