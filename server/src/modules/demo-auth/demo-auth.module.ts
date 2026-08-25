import { DynamicModule, Module } from '@nestjs/common';
import { DemoAuthController } from './demo-auth.controller';

/**
 * 演示登录模块。
 *
 * 仅在 AUTH_MOCK=true 时把 DemoAuthController 挂上；其它环境不注册任何控制器，
 * 保证真实部署（有下游 Java 网关）时登录仍走 JavaProxyMiddleware 转发，不受影响。
 *
 * 采用 register() 静态工厂 + 环境变量判断，与 SchedulerModule 的按需装配风格一致。
 */
@Module({})
export class DemoAuthModule {
  static register(): DynamicModule {
    const enabled = process.env.AUTH_MOCK === 'true';
    return {
      module: DemoAuthModule,
      controllers: enabled ? [DemoAuthController] : [],
    };
  }
}
