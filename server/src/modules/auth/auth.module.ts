import { Global, Module } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { OpaqueTokenGuard } from '../../common/guards/opaque-token.guard';
import { REDIS_CLIENT, redisProvider } from './redis.provider';

@Global()
@Module({
  providers: [
    redisProvider,
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, configService: ConfigService) =>
        new OpaqueTokenGuard(reflector, configService),
      inject: [Reflector, ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class AuthModule {}
