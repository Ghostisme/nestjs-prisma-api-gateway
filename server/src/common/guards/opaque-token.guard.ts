import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { UserContext } from '../interfaces/user-context.interface';

const MOCK_USER: UserContext = {
  tenantId: 1,
  userId: 1,
  username: 'admin',
  nickname: '开发管理员',
  deptId: 1,
  deptName: '技术部',
  roles: ['ROLE_1'],
  permissions: [
    'lmxAdmin:aiDashboard:userDashboard',
    'lmxAdmin:aiDashboard:tokenUsage',
    'lmxAdmin:aiDashboard:userFeedback',
    'lmxAdmin:aiManagement:tokenUserManagement',
    'lmxAdmin:aiManagement:tokenUserManagement:manageQuota',
    'lmxAdmin:aiManagement:tokenUserManagement:records',
    'lmxAdmin:aiManagement:tokenUserManagement:consumption',
    'lmxAdmin:aiManagement:tokenSystemManagement',
    'lmxAdmin:aiManagement:tokenSystemManagement:configDept',
    'lmxAdmin:aiManagement:tokenSystemManagement:configMember',
    'lmxAdmin:aiManagement:tokenSystemManagement:viewDetail',
    'lmxAdmin:aiManagement:userConversationStats',
    'lmxAdmin:aiManagement:userConversationStats:viewDetail',
    'lmxAdmin:aiManagement:bannedWords',
    'lmxAdmin:aiKnowledge:knowledgeBase',
    'lmxAdmin:partner:read',
    'lmxAdmin:partner:create',
    'lmxAdmin:partner:update',
    'lmxAdmin:partner:delete',
    'lmxAdmin:partner:disabled',
    'lmxAdmin:partner:enabled',
    'lmxAdmin:partner:createAccount',
    'admin:account:read',
    'admin:account:create',
    'admin:account:view',
    'admin:account:update',
    'admin:account:disabled',
    'admin:account:enabled',
    'admin:account:resetPassword',
    'admin:role:read',
    'admin:role:create',
    'admin:role:update',
    'admin:role:disabled',
    'admin:role:enabled',
    'admin:dept:read',
    'admin:dept:export',
    'admin:dept:viewDeptUsers',
    'admin:dept:exportDeptUsers',
    'lmxAdmin:global:upload',
    'lmxAdmin:global:download',
  ],
};

const TENANT_ID_HEADER = 'tenant-id';

@Injectable()
export class OpaqueTokenGuard implements CanActivate {
  private readonly logger = new Logger(OpaqueTokenGuard.name);
  private readonly isMockAuth: boolean;
  private readonly checkTokenUrl: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.isMockAuth =
      this.configService.get<string>('AUTH_MOCK', 'false') === 'true';
    if (this.isMockAuth) {
      this.logger.warn(
        'AUTH_MOCK=true, all requests will use mock user (dev only)',
      );
    }

    const gatewayUrl = this.configService
      .get<string>('JAVA_GATEWAY_URL', '')
      .replace(/\/+$/, '');
    this.checkTokenUrl = `${gatewayUrl}/auth/token/check_token`;
    this.logger.log(`Token validation endpoint: ${this.checkTokenUrl}`);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    if (this.isMockAuth) {
      request.user = MOCK_USER;
      return true;
    }

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.validateTokenViaGateway(token, request);
    request.user = user;
    return true;
  }

  private extractToken(request: any): string | null {
    const auth = request.headers?.authorization;
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' && token ? token : null;
  }

  private async validateTokenViaGateway(
    token: string,
    request: any,
  ): Promise<UserContext> {
    const url = `${this.checkTokenUrl}?token=${encodeURIComponent(token)}`;

    const tenantId = this.getHeader(request, TENANT_ID_HEADER);
    const businessCode = this.getHeader(request, 'business-code');
    const authorization = request.headers?.authorization;

    const headers: Record<string, string> = {};
    if (tenantId) headers['TENANT-ID'] = tenantId;
    if (businessCode) headers['Business-Code'] = businessCode;
    if (authorization) headers['Authorization'] = authorization;

    this.logger.debug(
      `Validating token via Gateway: ${this.checkTokenUrl}, token=${token.substring(0, 8)}...`,
    );

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        this.logger.warn(
          `Gateway check_token HTTP ${response.status}: ${response.statusText}`,
        );
        throw new UnauthorizedException('登录凭证无效或已过期');
      }

      const body = await response.json();

      // Java R<T> 响应格式: { code: 0, data: {...}, msg: null }
      if (body.code === 401) {
        this.logger.warn(
          `Token invalid: ${body.msg ?? 'invalid_bearer_token'}`,
        );
        throw new UnauthorizedException('登录凭证无效或已过期');
      }
      if (body.code === 424) {
        this.logger.warn('Token expired');
        throw new UnauthorizedException('登录凭证已过期');
      }
      if (body.code !== 0 || !body.data) {
        this.logger.warn(
          `Unexpected check_token response: code=${body.code}, msg=${body.msg}`,
        );
        throw new UnauthorizedException('凭证校验失败');
      }

      return this.parseTokenData(body.data, tenantId);
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error('check_token request failed', err);
      throw new UnauthorizedException('凭证校验服务不可用');
    }
  }

  private parseTokenData(
    data: Record<string, any>,
    tenantIdRaw: string | null,
  ): UserContext {
    const tenantId = tenantIdRaw ? Number(tenantIdRaw) : 1;

    // check_token 返回 OAuth2AccessTokenResponse 格式
    // data 中包含 user_info、user_id、username 等 claims
    const userInfo = data.user_info ?? {};
    const userId =
      data.user_id ?? userInfo.user_id ?? userInfo.userId ?? null;
    const username =
      data.username ?? data.sub ?? userInfo.username ?? '';
    const nickname =
      userInfo.nickname ?? userInfo.name ?? username;

    if (!userId) {
      this.logger.warn('check_token response missing user_id');
      throw new UnauthorizedException('Incomplete token claims');
    }

    const authorities: string[] =
      userInfo.authorities?.map((a: any) =>
        typeof a === 'string' ? a : a?.authority,
      ) ?? [];

    return {
      tenantId,
      userId,
      username,
      nickname,
      deptId: userInfo.deptId ?? null,
      deptName: userInfo.deptName ?? null,
      roles: authorities.filter((a) => a?.startsWith('ROLE_')),
      permissions: authorities.filter((a) => !a?.startsWith('ROLE_')),
    };
  }

  private getHeader(request: any, name: string): string | null {
    const headers = request.headers ?? {};
    const value =
      headers[name] ??
      headers[name.toLowerCase()] ??
      (typeof request.get === 'function' ? request.get(name) : undefined) ??
      (typeof request.header === 'function'
        ? request.header(name)
        : undefined);

    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return typeof value === 'string' ? value : null;
  }
}
