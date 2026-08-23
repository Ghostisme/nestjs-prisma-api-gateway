import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import type { CreateApiKeyDto, ApiKeyQueryDto } from './dto/api-key.dto';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: number, userId: number, dto: CreateApiKeyDto) {
    const rawKey = `lmx_sk_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = `${rawKey.slice(0, 12)}...${rawKey.slice(-4)}`;

    const apiKey = await this.prisma.lumaxApiKey.create({
      data: {
        tenantId,
        userId,
        name: dto.name,
        keyHash,
        keyPrefix,
        scopes: dto.scopes ?? [],
        rateLimit: dto.rateLimit ?? -1,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  async list(tenantId: number, userId: number, query: ApiKeyQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = {
      tenantId,
      userId,
      ...(query.status && { status: query.status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.lumaxApiKey.findMany({
        where,
        select: {
          id: true, name: true, keyPrefix: true, scopes: true,
          rateLimit: true, expiresAt: true, lastUsedAt: true,
          status: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.lumaxApiKey.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async revoke(tenantId: number, userId: number, id: number) {
    const key = await this.prisma.lumaxApiKey.findFirst({
      where: { id, tenantId, userId },
    });
    if (!key) throw new BusinessException(ErrorCode.API_KEY_NOT_FOUND);
    if (key.status === 'revoked') throw new BusinessException(ErrorCode.API_KEY_ALREADY_REVOKED);

    await this.prisma.lumaxApiKey.update({
      where: { id },
      data: { status: 'revoked' },
    });
    return { success: true };
  }

  async remove(tenantId: number, userId: number, id: number) {
    const key = await this.prisma.lumaxApiKey.findFirst({
      where: { id, tenantId, userId },
    });
    if (!key) throw new BusinessException(ErrorCode.API_KEY_NOT_FOUND);

    await this.prisma.lumaxApiKey.delete({ where: { id } });
    return { success: true };
  }

  async getUsage(tenantId: number, id: number) {
    const key = await this.prisma.lumaxApiKey.findFirst({
      where: { id, tenantId },
    });
    if (!key) throw new BusinessException(ErrorCode.API_KEY_NOT_FOUND);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await this.prisma.lumaxTokenConsumption.aggregate({
      where: { tenantId, userId: key.userId, consumedAt: { gte: monthStart } },
      _sum: { totalTokens: true },
      _count: true,
    });

    return {
      keyId: id,
      keyName: key.name,
      tokensUsed: usage._sum.totalTokens ?? 0,
      callsCount: usage._count,
      lastUsedAt: key.lastUsedAt,
    };
  }
}
