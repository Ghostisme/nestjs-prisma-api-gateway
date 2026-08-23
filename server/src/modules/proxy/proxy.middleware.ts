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

  constructor(private readonly configService: ConfigService) {
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
