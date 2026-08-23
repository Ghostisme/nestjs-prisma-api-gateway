import { OrgService } from './org.service';

describe('OrgService', () => {
  function createService() {
    const prisma: any = {
      lumaxUserQuota: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((operations) => Promise.all(operations)),
    };
    const redis: any = {
      del: jest.fn().mockResolvedValue(2),
    };
    return { service: new OrgService(prisma, {} as any, redis), prisma, redis };
  }

  it('clears member quota Redis key after member token config update succeeds', async () => {
    const { service, redis } = createService();

    await service.setMemberTokenConfig(1, 2, { unlimited: false, quota: 100, period: 'month' });

    expect(redis.del).toHaveBeenCalledWith('1:lumax:quota:used:2');
  });

  it('clears all department member quota Redis keys after department token config update succeeds', async () => {
    const { service, redis } = createService();

    await service.setDeptTokenConfig(1, 2, { unlimited: false, quota: 100, period: 'month' });

    expect(redis.del).toHaveBeenCalledWith('1:lumax:quota:used:2', '1:lumax:quota:used:3');
  });
});
