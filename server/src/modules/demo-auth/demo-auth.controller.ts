import { Controller, Post, Logger } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'node:crypto';
import { Public } from '../../common/decorators/public.decorator';
import { DEMO_PERMISSIONS } from './demo-user.fixture';

/**
 * 演示登录控制器（仅在 AUTH_MOCK=true 时生效）。
 *
 * 背景：本项目的 NestJS 服务本质是一个 API 网关，真实登录会被 JavaProxyMiddleware
 * 转发到下游 Java 认证网关（JAVA_GATEWAY_URL）。在 Vercel 这类只部署了本网关、
 * 没有下游 Java 服务的演示环境里，登录链路无法打通，访客点登录只会得到
 * "Gateway proxy error / ECONNREFUSED"。
 *
 * 为了让 portfolio 演示站可以一键进入后台（后台业务数据仍来自真实 Aiven 数据库），
 * 这里在 AUTH_MOCK 模式下用一个自洽的演示登录端点替代下游 Java：
 *   - /auth/oauth2/pre-login：返回单个可选租户，前端会自动选中并直接完成登录；
 *   - /auth/oauth2/token：签发一个演示 access_token 并返回前端期望的用户信息。
 *
 * 该模式与全局 OpaqueTokenGuard 的 AUTH_MOCK 分支配套使用：后者在同一开关下对
 * 所有受保护接口注入 MOCK_USER，因此这里返回的 token 不需要真正被校验——它只是
 * 让前端把登录态写进 store 的凭证。切勿在接生产真实用户的环境启用 AUTH_MOCK。
 */
@ApiTags('Demo Auth (AUTH_MOCK only)')
@Controller('auth/oauth2')
export class DemoAuthController {
  private readonly logger = new Logger(DemoAuthController.name);

  /**
   * 预登录：真实实现会校验账号并返回该用户可登录的租户列表。
   * 演示模式下固定返回一个可用租户，触发前端"单租户自动选中"分支，
   * 省去访客手动选组织的步骤。
   */
  @Public()
  @Post('pre-login')
  @ApiOperation({ summary: '演示预登录（返回单一可用租户）' })
  preLogin() {
    return {
      userId: 1,
      username: 'admin',
      nickname: 'Dev Admin',
      phone: '13800138000',
      // status !== 1 才会被前端 getDefaultTenantId 选中，这里用 0 表示可用。
      tenantOptions: [
        {
          tenantId: 1,
          tenantName: 'Lumax Demo Org',
          tenantCode: 'lumax-demo',
          status: 0,
          businessCodes: ['ai'],
        },
      ],
    };
  }

  /**
   * 令牌签发：返回前端 useSignIn 需要的 { access_token, refresh_token, user_info }。
   * ResponseInterceptor 会自动把它包成 { code: 0, msg, data } 信封。
   *
   * token 用随机串仅为"看起来真实"；实际鉴权由 AUTH_MOCK 下的 guard 直接放行，
   * 不依赖此 token 的内容。
   */
  @Public()
  @Post('token')
  @ApiOperation({ summary: '演示令牌签发' })
  token() {
    const accessToken = `demo-${randomBytes(24).toString('hex')}`;
    const refreshToken = `demo-refresh-${randomBytes(24).toString('hex')}`;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user_info: {
        id: '1',
        userId: 1,
        username: 'admin',
        nickname: 'Dev Admin',
        email: 'admin@lumax.demo',
        phone: 13800138000,
        // 前端把 permissions 当作权限 code 字符串数组消费，与 guard 的 MOCK_USER 保持一致，
        // 保证登录后菜单/按钮权限齐全。
        permissions: DEMO_PERMISSIONS,
        roles: [{ id: 'ROLE_1', name: 'Admin' }],
      },
    };
  }
}
