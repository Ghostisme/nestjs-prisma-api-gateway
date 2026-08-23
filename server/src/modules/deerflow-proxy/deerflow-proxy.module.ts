import { type MiddlewareConsumer, Logger, Module, type NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Response } from 'express';

@Module({})
export class DeerFlowProxyModule implements NestModule {
  private readonly logger = new Logger(DeerFlowProxyModule.name);

  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const target = this.configService.get<string>(
      'DEERFLOW_GATEWAY_URL',
      'http://localhost:2026',
    );

    const proxyPaths = [
      '/api/lumax/v1/deerflow/threads',
      '/api/lumax/v1/deerflow/runs',
      '/api/lumax/v1/deerflow/skills',
      '/api/lumax/v1/deerflow/memory',
      '/api/lumax/v1/deerflow/models',
    ];

    for (const path of proxyPaths) {
      const segment = path.split('/deerflow/')[1];
      consumer
        .apply(
          createProxyMiddleware({
            target,
            changeOrigin: true,
            pathRewrite: { [`^/api/lumax/v1/deerflow/${segment}`]: `/api/${segment}` },
            on: {
              proxyReq: (proxyReq, req: any) => {
                if (req.user) {
                  proxyReq.setHeader('X-Tenant-Id', String(req.user.tenantId));
                  proxyReq.setHeader('X-User-Id', String(req.user.userId));
                }
              },
              error: (err, _req, res) => {
                this.logger.error(`DeerFlow proxy error [${segment}]`, err.message);
                if (res && 'writeHead' in res) {
                  const httpRes = res as Response;
                  if (!httpRes.headersSent && !httpRes.writableEnded) {
                    httpRes.status(502).json({
                      code: 502,
                      message: `DeerFlow proxy error: ${err.message}`,
                    });
                  }
                }
              },
            },
          }),
        )
        .forRoutes(`lumax/v1/deerflow/${segment}*path`);
    }
  }
}
