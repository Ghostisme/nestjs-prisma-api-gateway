import { DynamicModule, Module } from '@nestjs/common';
import { DemoAuthController } from './demo-auth.controller';
import { DemoAdminController } from './demo-admin.controller';

/**
 * 演示登录 + 管理占位模块。
 *
 * 仅在 AUTH_MOCK=true 时注册控制器：
 *   - DemoAuthController：演示登录端点（pre-login / token）；
 *   - DemoAdminController：/admin/* 占位兜底，防止管理页面因下游 Java 缺失而报错。
 *
 * 其它环境（有真实下游 Java 网关）不注册任何控制器，登录与 /admin/* 仍走
 * JavaProxyMiddleware 转发，行为不受影响。
 *
 * 采用 register() 静态工厂 + 环境变量判断，与 SchedulerModule 的按需装配风格一致。
 */
@Module({})
export class DemoAuthModule {
  static register(): DynamicModule {
    const enabled = process.env.AUTH_MOCK === 'true';
    return {
      module: DemoAuthModule,
      controllers: enabled ? [DemoAuthController, DemoAdminController] : [],
    };
  }
}
