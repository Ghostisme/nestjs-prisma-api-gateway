import { TokenManagementService } from './token-management.service';

describe('TokenManagementService', () => {
  function createService() {
    const prisma: any = {
      lumaxUserQuota: {
        findUnique: jest.fn().mockResolvedValue({ tenantId: 1, userId: 2, totalQuota: 100, usedQuota: 10 }),
        create: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
      },
      lumaxQuotaOperation: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((operations) => Promise.all(operations)),
    };
    const redis: any = {
      del: jest.fn().mockResolvedValue(1),
    };
    return { service: new TokenManagementService(prisma, redis), prisma, redis };
  }

  it('clears quota Redis key after quota update succeeds', async () => {
    const { service, redis } = createService();

    await service.updateQuota(
      1,
      2,
      { operationType: 'increase', value: 50 },
      { tenantId: 1, userId: 99, username: 'admin', nickname: 'Admin', roles: [], permissions: [] },
    );

    expect(redis.del).toHaveBeenCalledWith('1:lumax:quota:used:2');
  });

  it('does not fail quota update when Redis cleanup fails', async () => {
    const { service, redis } = createService();
    redis.del.mockRejectedValue(new Error('redis unavailable'));

    await expect(
      service.updateQuota(
        1,
        2,
        { operationType: 'increase', value: 50 },
        { tenantId: 1, userId: 99, username: 'admin', nickname: 'Admin', roles: [], permissions: [] },
      ),
    ).resolves.toEqual({ success: true });
  });
});
