import { BusinessException } from '../../common/filters/business-exception.filter';
import { UsageMeteringService } from './usage-metering.service';

describe('UsageMeteringService', () => {
  function createService(txOverrides: Record<string, unknown> = {}) {
    const tx: any = {
      lumaxTokenConsumption: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
      lumaxUserQuota: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      lumaxConversation: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 10 }),
        update: jest.fn().mockResolvedValue({ id: 10 }),
      },
      lumaxConversationMessage: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      ...txOverrides,
    };
    const prisma: any = {
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const llmModelService: any = {
      calculateCost: jest.fn().mockResolvedValue({
        inputCost: 0, outputCost: 0, cacheCost: 0, totalCost: 0, priceTierId: null,
      }),
    };
    return { service: new UsageMeteringService(prisma, llmModelService), tx };
  }

  it('deduplicates reports by idempotency key', async () => {
    const { service, tx } = createService({
      lumaxTokenConsumption: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, conversationId: 10 }),
        create: jest.fn(),
      },
    });

    const result = await service.report({
      idempotencyKey: 'deerflow:run-1:settlement',
      tenantId: 1,
      userId: 2,
      threadId: 'thread-1',
      runId: 'run-1',
      modelName: 'doubao',
      tokensIn: 10,
      tokensOut: 5,
    });

    expect(result).toEqual({ success: true, duplicate: true, conversationId: 10 });
    expect(tx.lumaxTokenConsumption.create).not.toHaveBeenCalled();
    expect(tx.lumaxUserQuota.upsert).not.toHaveBeenCalled();
  });

  it('stores usage, messages, and increments user quota atomically', async () => {
    const { service, tx } = createService();

    const result = await service.report({
      idempotencyKey: 'deerflow:run-2:settlement',
      tenantId: 1,
      userId: 2,
      threadId: 'thread-1',
      runId: 'run-2',
      modelName: 'doubao',
      agentName: 'lead',
      tokensIn: 10,
      tokensOut: 5,
      cacheReadTokens: 2,
      messages: [
        { messageId: 'm1', role: 'user', content: 'hi', messageIndex: 0 },
        { messageId: 'm2', role: 'assistant', content: 'hello', messageIndex: 1 },
      ],
    });

    expect(result).toEqual({ success: true, duplicate: false, conversationId: 10 });
    expect(tx.lumaxTokenConsumption.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: 'deerflow:run-2:settlement',
          threadId: 'thread-1',
          runId: 'run-2',
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
          cacheReadTokens: 2,
        }),
      }),
    );
    expect(tx.lumaxConversationMessage.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ messageId: 'm1', role: 'user' }),
          expect.objectContaining({ messageId: 'm2', role: 'assistant' }),
        ]),
        skipDuplicates: true,
      }),
    );
    expect(tx.lumaxUserQuota.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_userId: { tenantId: 1, userId: 2 } },
        update: { usedQuota: { increment: 15 } },
      }),
    );
  });

  it('uses explicit totalTokens for providers that do not split input and output tokens', async () => {
    const { service, tx } = createService();

    await service.report({
      idempotencyKey: 'deerflow:run-total:settlement',
      tenantId: 1,
      userId: 2,
      threadId: 'thread-1',
      runId: 'run-total',
      modelName: 'doubao',
      tokensIn: 0,
      tokensOut: 0,
      tokensTotal: 42,
    });

    expect(tx.lumaxTokenConsumption.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 42,
        }),
      }),
    );
    expect(tx.lumaxUserQuota.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { usedQuota: { increment: 42 } },
      }),
    );
  });

  it('uses a conditional update for limited quotas', async () => {
    const { service, tx } = createService({
      lumaxUserQuota: {
        findUnique: jest.fn().mockResolvedValue({ tenantId: 1, userId: 2, totalQuota: 100, usedQuota: 20 }),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    });

    await service.report({
      idempotencyKey: 'deerflow:run-4:settlement',
      tenantId: 1,
      userId: 2,
      threadId: 'thread-1',
      runId: 'run-4',
      modelName: 'doubao',
      tokensIn: 10,
      tokensOut: 5,
    });

    expect(tx.lumaxUserQuota.updateMany).toHaveBeenCalledWith({
      where: {
        tenantId: 1,
        userId: 2,
        totalQuota: { not: -1 },
        usedQuota: { lte: 85 },
      },
      data: { usedQuota: { increment: 15 } },
    });
  });

  it('rejects settlement when limited quota is insufficient', async () => {
    const { service } = createService({
      lumaxUserQuota: {
        findUnique: jest.fn().mockResolvedValue({ tenantId: 1, userId: 2, totalQuota: 10, usedQuota: 9 }),
        upsert: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    });

    await expect(
      service.report({
        idempotencyKey: 'deerflow:run-3:settlement',
        tenantId: 1,
        userId: 2,
        threadId: 'thread-1',
        runId: 'run-3',
        modelName: 'doubao',
        tokensIn: 10,
        tokensOut: 5,
      }),
    ).rejects.toBeInstanceOf(BusinessException);
  });
});
