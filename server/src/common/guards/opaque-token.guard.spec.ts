import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { OpaqueTokenGuard } from './opaque-token.guard';

const ACCESS_TOKEN_CLASS =
  'org.springframework.security.oauth2.core.OAuth2AccessToken';

function createExecutionContext(request: any) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as any;
}

function createGuard(redisGet = jest.fn()) {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  } as unknown as Reflector;
  const redis = {
    get: redisGet,
  };
  const configService = {
    get: jest.fn((key: string, defaultValue?: string) =>
      key === 'AUTH_MOCK' ? 'false' : defaultValue,
    ),
  } as unknown as ConfigService;

  return {
    guard: new OpaqueTokenGuard(reflector, redis as any, configService),
    redis,
  };
}

function tokenPayload() {
  return JSON.stringify({
    tokens: {
      [ACCESS_TOKEN_CLASS]: {
        metadata: {
          'metadata.token.claims': {
            tenant_id: 88,
            user_id: 99,
            username: 'tester',
            user_info: {
              nickname: 'Tester',
              authorities: [{ authority: 'ROLE_ADMIN' }, 'lumax:read'],
            },
          },
        },
      },
    },
  });
}

describe('OpaqueTokenGuard', () => {
  it('uses TenantId and BUSINESS_CODE headers to build Redis token key', async () => {
    const redisGet = jest.fn().mockResolvedValue(tokenPayload());
    const { guard, redis } = createGuard(redisGet);
    const request: any = {
      headers: {
        authorization: 'Bearer abc-token',
        tenantid: '88',
        business_code: 'xdwx',
      },
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);

    expect(redis.get).toHaveBeenCalledWith(
      '88:xdwx:token::access_token::abc-token',
    );
    expect(request.user).toMatchObject({
      tenantId: 88,
      userId: 99,
      username: 'tester',
    });
  });

  it('rejects requests without tenant and business headers before Redis lookup', async () => {
    const redisGet = jest.fn();
    const { guard } = createGuard(redisGet);
    const request = {
      headers: {
        authorization: 'Bearer abc-token',
      },
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(redisGet).not.toHaveBeenCalled();
  });
});
