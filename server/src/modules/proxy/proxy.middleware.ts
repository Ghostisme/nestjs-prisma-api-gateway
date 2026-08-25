import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';

const GATEWAY_HEADERS = {
  AUTHORIZATION: 'authorization',
  BUSINESS_CODE: 'business-code',
  TENANT_ID: 'tenant-id',
} as const;

@Injectable()
export class JavaProxyMiddleware implements NestMiddleware {
  private readonly proxy: ReturnType<typeof createProxyMiddleware>;
  private readonly logger = new Logger(JavaProxyMiddleware.name);
  /**
   * 演示模式开关。为 true 时，登录相关的 /auth/* 请求不再转发到下游 Java 网关，
   * 而是放行给本服务内的 DemoAuthController 处理（Vercel 演示站没有下游 Java，
   * 转发只会得到 ECONNREFUSED）。与 OpaqueTokenGuard 的 AUTH_MOCK 分支配套。
   */
  private readonly isMockAuth: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isMockAuth =
      this.configService.get<string>('AUTH_MOCK', 'false') === 'true';

    const target = this.configService.get<string>(
      'JAVA_GATEWAY_URL',
      'http://localhost:8080/api',
    );

    const options: Options = {
      target,
      changeOrigin: true,
      pathRewrite: undefined,
      on: {
        proxyReq: (proxyReq, req: any) => {
          const authorization = req.headers[GATEWAY_HEADERS.AUTHORIZATION];
          if (authorization) {
            proxyReq.setHeader('Authorization', authorization);
          }

          const businessCode = req.headers[GATEWAY_HEADERS.BUSINESS_CODE];
          if (businessCode) {
            proxyReq.setHeader('Business-Code', businessCode);
          }

          const tenantId = req.headers[GATEWAY_HEADERS.TENANT_ID];
          if (tenantId) {
            proxyReq.setHeader('TENANT-ID', tenantId);
          }

          this.logger.debug(
            `Proxy → ${req.method} ${req.originalUrl} | ` +
              `Business-Code=${businessCode ?? 'N/A'} ` +
              `TENANT-ID=${tenantId ?? 'N/A'} ` +
              `Auth=${authorization ? 'present' : 'missing'}`,
          );
        },
        error: (err, _req, res) => {
          this.logger.error('Proxy error', err.message);
          if (res && 'writeHead' in res) {
            const httpRes = res as Response;
            if (!httpRes.headersSent && !httpRes.writableEnded) {
              httpRes.status(502).json({
                code: 502,
                message: `Gateway proxy error: ${err.message}`,
              });
            }
          }
        },
      },
    };

    this.proxy = createProxyMiddleware(options);
  }

  use(req: Request, res: Response, next: NextFunction) {
    const isAuthRoute =
      req.originalUrl.startsWith('/api/auth/') ||
      req.originalUrl.startsWith('/auth/');
    const isAdminRoute =
      req.originalUrl.startsWith('/api/admin/') ||
      req.originalUrl.startsWith('/admin/');

    // 演示模式：登录(/auth/*)与管理类(/admin/*)请求都不转发到下游 Java（演示环境不存在），
    // 交给本服务内的 DemoAuthController / DemoAdminController 用占位数据兜底，
    // 保证前端所有页面可打开、不因转发失败而白屏或报错。
    if (this.isMockAuth && (isAuthRoute || isAdminRoute)) {
      next();
      return;
    }

    if (isAuthRoute) {
      this.proxy(req, res, next);
      return;
    }

    const missing: string[] = [];

    if (!req.headers[GATEWAY_HEADERS.AUTHORIZATION]) {
      missing.push('Authorization');
    }
    if (!req.headers[GATEWAY_HEADERS.BUSINESS_CODE]) {
      missing.push('Business-Code');
    }
    if (!req.headers[GATEWAY_HEADERS.TENANT_ID]) {
      missing.push('TENANT-ID');
    }

    if (missing.length) {
      this.logger.warn(
        `Blocked ${req.method} ${req.originalUrl} – missing: ${missing.join(', ')}`,
      );
      const status = missing.includes('Authorization') ? 401 : 400;
      res.status(status).json({
        code: status,
        message: `缺少必要请求头: ${missing.join(', ')}`,
      });
      return;
    }

    this.proxy(req, res, next);
  }
}
