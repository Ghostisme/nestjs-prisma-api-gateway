import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/business-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

/**
 * Applies all app-wide configuration (global prefix, validation, filters,
 * interceptors, CORS, Swagger) to a freshly created Nest application.
 *
 * Extracted from `bootstrap()` so both entry points share identical wiring:
 *   - `bootstrap()` below — the long-running server (`node dist/main`), used
 *     locally and on process-based hosts (Railway/Render/Docker/VM).
 *   - `api/index.ts` — the Vercel serverless handler, which needs the very
 *     same setup but must NOT call `app.listen()`.
 *
 * Keeping this in one place means the serverless demo and the production
 * server can never drift apart in how they parse/validate/format requests.
 *
 * @param app - a Nest application created from {@link AppModule}
 * @returns the same app instance, configured (not yet listening)
 */
export function configureApp(app: INestApplication): INestApplication {
  const configService = app.get(ConfigService);

  // CORS: default open (handy for a public cross-origin demo where the SPA and
  // API live on different Vercel domains). Lock it down by setting CORS_ORIGINS
  // to a comma-separated allowlist in production.
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '');
  app.enableCors(
    corsOrigins.trim()
      ? { origin: corsOrigins.split(',').map((o) => o.trim()), credentials: true }
      : {},
  );

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

  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';
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

  return app;
}

/**
 * Long-running server entry point. Not used by the serverless handler.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 9008);
  await app.listen(port);

  const server = app.getHttpServer();
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  const swaggerEnabled =
    configService.get<string>('SWAGGER_ENABLED', 'true') === 'true';
  console.log(`Lumax Service running on http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`Swagger docs: http://localhost:${port}/api-docs`);
  }
}

// Only auto-start when run as the main process (node dist/main). When this file
// is merely imported (e.g. by the serverless handler to reuse configureApp),
// we must not spin up a listener.
if (require.main === module) {
  void bootstrap();
}
