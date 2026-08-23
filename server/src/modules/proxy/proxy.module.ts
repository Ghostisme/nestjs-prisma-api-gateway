import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JavaProxyMiddleware } from './proxy.middleware';

@Module({})
export class ProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JavaProxyMiddleware)
      .forRoutes('/auth/*path', '/admin/*path');
  }
}
