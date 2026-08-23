import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { PageResult } from '../../common/dto/response.dto';
import type { CreateLlmModelDto, LlmModelListDto, PriceTierDto, UpdateLlmModelDto } from './dto/llm-model.dto';

@Injectable()
export class LlmModelService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: number, dto: LlmModelListDto) {
    const { current = 1, size = 10 } = dto;

    const where: any = { tenantId };
    if (dto.modelName) where.modelName = { contains: dto.modelName };
    if (dto.provider) where.provider = dto.provider;
    if (dto.modelType) where.modelType = dto.modelType;
    if (dto.status) where.status = dto.status;

    const [rows, total] = await Promise.all([
      this.prisma.lumaxLlmModel.findMany({
        where,
        include: { priceTiers: { orderBy: { sortOrder: 'asc' } } },
        skip: (current - 1) * size,
        take: size,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.lumaxLlmModel.count({ where }),
    ]);

    const records = rows.map((m) => this.formatModel(m));
    return PageResult.of(records, total, current, size);
  }

  async getById(tenantId: number, id: number) {
    const model = await this.prisma.lumaxLlmModel.findFirst({
      where: { id, tenantId },
      include: { priceTiers: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!model) {
      throw new BusinessException(ErrorCode.LLM_MODEL_NOT_FOUND);
    }
    return this.formatModel(model);
  }

  async create(tenantId: number, dto: CreateLlmModelDto) {
    const existing = await this.prisma.lumaxLlmModel.findUnique({
      where: { tenantId_modelCode: { tenantId, modelCode: dto.modelCode } },
    });
    if (existing) {
      throw new BusinessException(ErrorCode.LLM_MODEL_CODE_EXISTS);
    }

    const model = await this.prisma.$transaction(async (tx) => {
      const created = await tx.lumaxLlmModel.create({
        data: {
          tenantId,
          modelCode: dto.modelCode,
          modelName: dto.modelName,
          provider: dto.provider,
          modelType: dto.modelType ?? 'chat',
          maxContextTokens: dto.maxContextTokens ?? 0,
          maxOutputTokens: dto.maxOutputTokens ?? 0,
          inputPrice: dto.inputPrice ?? 0,
          outputPrice: dto.outputPrice ?? 0,
          cacheWritePrice: dto.cacheWritePrice ?? 0,
          cacheReadPrice: dto.cacheReadPrice ?? 0,
          cacheStoragePrice: dto.cacheStoragePrice ?? 0,
          priceUnit: dto.priceUnit ?? 'per_1k_tokens',
          currency: dto.currency ?? 'CNY',
          hasTieredPricing: dto.hasTieredPricing ?? false,
          supportedInferenceModes: dto.supportedInferenceModes ?? 'online',
          sortOrder: dto.sortOrder ?? 0,
          description: dto.description ?? '',
        },
      });

      if (dto.priceTiers?.length) {
        await tx.lumaxLlmModelPriceTier.createMany({
          data: dto.priceTiers.map((t, i) => this.buildTierData(created.id, t, i)),
        });
      }

      return tx.lumaxLlmModel.findFirst({
        where: { id: created.id },
        include: { priceTiers: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return this.formatModel(model!);
  }

  async update(tenantId: number, id: number, dto: UpdateLlmModelDto) {
    const model = await this.prisma.lumaxLlmModel.findFirst({
      where: { id, tenantId },
    });
    if (!model) {
      throw new BusinessException(ErrorCode.LLM_MODEL_NOT_FOUND);
    }

    const data: any = {};
    if (dto.modelName !== undefined) data.modelName = dto.modelName;
    if (dto.provider !== undefined) data.provider = dto.provider;
    if (dto.modelType !== undefined) data.modelType = dto.modelType;
    if (dto.maxContextTokens !== undefined) data.maxContextTokens = dto.maxContextTokens;
    if (dto.maxOutputTokens !== undefined) data.maxOutputTokens = dto.maxOutputTokens;
    if (dto.inputPrice !== undefined) data.inputPrice = dto.inputPrice;
    if (dto.outputPrice !== undefined) data.outputPrice = dto.outputPrice;
    if (dto.cacheWritePrice !== undefined) data.cacheWritePrice = dto.cacheWritePrice;
    if (dto.cacheReadPrice !== undefined) data.cacheReadPrice = dto.cacheReadPrice;
    if (dto.cacheStoragePrice !== undefined) data.cacheStoragePrice = dto.cacheStoragePrice;
    if (dto.priceUnit !== undefined) data.priceUnit = dto.priceUnit;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.hasTieredPricing !== undefined) data.hasTieredPricing = dto.hasTieredPricing;
    if (dto.supportedInferenceModes !== undefined) data.supportedInferenceModes = dto.supportedInferenceModes;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.description !== undefined) data.description = dto.description;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.lumaxLlmModel.update({ where: { id }, data });

      if (dto.priceTiers !== undefined) {
        await tx.lumaxLlmModelPriceTier.deleteMany({ where: { modelId: id } });
        if (dto.priceTiers.length) {
          await tx.lumaxLlmModelPriceTier.createMany({
            data: dto.priceTiers.map((t, i) => this.buildTierData(id, t, i)),
          });
        }
      }

      return tx.lumaxLlmModel.findFirst({
        where: { id },
        include: { priceTiers: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return this.formatModel(updated!);
  }

  async updateStatus(tenantId: number, id: number, status: string) {
    const model = await this.prisma.lumaxLlmModel.findFirst({
      where: { id, tenantId },
    });
    if (!model) {
      throw new BusinessException(ErrorCode.LLM_MODEL_NOT_FOUND);
    }

    await this.prisma.lumaxLlmModel.update({
      where: { id },
      data: { status },
    });

    return { success: true };
  }

  async delete(tenantId: number, id: number) {
    const model = await this.prisma.lumaxLlmModel.findFirst({
      where: { id, tenantId },
    });
    if (!model) {
      throw new BusinessException(ErrorCode.LLM_MODEL_NOT_FOUND);
    }

    await this.prisma.lumaxLlmModel.delete({ where: { id } });
    return { success: true };
  }

  async getProviders(tenantId: number) {
    const models = await this.prisma.lumaxLlmModel.findMany({
      where: { tenantId },
      distinct: ['provider'],
      select: { provider: true },
    });
    return models.map((m) => m.provider).filter(Boolean);
  }

  /**
   * 根据模型名称和 token 数量匹配价格分段，计算费用。
   * 计费公式（火山方舟）：
   *   费用 = 输入单价 × 输入token + 缓存输入单价 × 缓存命中token + 输出单价 × 输出token
   * 所有价格单位：元/百万token
   */
  async calculateCost(
    tenantId: number,
    modelName: string,
    inputTokens: number,
    outputTokens: number,
    cacheReadTokens = 0,
    inferenceMode = 'online',
  ): Promise<{ inputCost: number; outputCost: number; cacheCost: number; totalCost: number; priceTierId: number | null }> {
    const model = await this.prisma.lumaxLlmModel.findFirst({
      where: { tenantId, OR: [{ modelCode: modelName }, { modelName }] },
      include: { priceTiers: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!model) {
      return { inputCost: 0, outputCost: 0, cacheCost: 0, totalCost: 0, priceTierId: null };
    }

    const inputLenK = inputTokens / 1000;
    const outputLenK = outputTokens / 1000;

    if (model.hasTieredPricing && model.priceTiers.length > 0) {
      const tier = model.priceTiers.find((t) => {
        if (t.inferenceMode !== inferenceMode) return false;
        const inMin = t.inputLengthMin;
        const inMax = t.inputLengthMax === -1 ? Infinity : t.inputLengthMax;
        if (inputLenK < inMin || inputLenK > inMax) return false;
        if (t.outputLengthMin > 0 || (t.outputLengthMax !== -1 && t.outputLengthMax > 0)) {
          const outMin = t.outputLengthMin;
          const outMax = t.outputLengthMax === -1 ? Infinity : t.outputLengthMax;
          if (outputLenK < outMin || outputLenK > outMax) return false;
        }
        return true;
      });

      if (tier) {
        const inputCost = +(inputTokens * Number(tier.inputPrice) / 1_000_000).toFixed(6);
        const outputCost = +(outputTokens * Number(tier.outputPrice) / 1_000_000).toFixed(6);
        const cacheCost = +(cacheReadTokens * Number(tier.cacheReadPrice) / 1_000_000).toFixed(6);
        return {
          inputCost,
          outputCost,
          cacheCost,
          totalCost: +(inputCost + outputCost + cacheCost).toFixed(6),
          priceTierId: tier.id,
        };
      }
    }

    const divisor = model.priceUnit === 'per_1m_tokens' ? 1_000_000 : 1_000;
    const inputCost = +(inputTokens * Number(model.inputPrice) / divisor).toFixed(6);
    const outputCost = +(outputTokens * Number(model.outputPrice) / divisor).toFixed(6);
    const cacheCost = +(cacheReadTokens * Number(model.cacheReadPrice) / divisor).toFixed(6);
    return {
      inputCost,
      outputCost,
      cacheCost,
      totalCost: +(inputCost + outputCost + cacheCost).toFixed(6),
      priceTierId: null,
    };
  }

  private buildTierData(modelId: number, t: PriceTierDto, index: number) {
    return {
      modelId,
      inferenceMode: t.inferenceMode ?? 'online',
      inputLengthMin: t.inputLengthMin ?? 0,
      inputLengthMax: t.inputLengthMax ?? -1,
      outputLengthMin: t.outputLengthMin ?? 0,
      outputLengthMax: t.outputLengthMax ?? -1,
      inputPrice: t.inputPrice,
      outputPrice: t.outputPrice,
      cacheStoragePrice: t.cacheStoragePrice ?? 0,
      cacheReadPrice: t.cacheReadPrice ?? 0,
      sortOrder: t.sortOrder ?? index,
    };
  }

  private formatModel(m: any) {
    return {
      id: m.id,
      modelCode: m.modelCode,
      modelName: m.modelName,
      provider: m.provider,
      modelType: m.modelType,
      maxContextTokens: m.maxContextTokens,
      maxOutputTokens: m.maxOutputTokens,
      inputPrice: Number(m.inputPrice),
      outputPrice: Number(m.outputPrice),
      cacheWritePrice: Number(m.cacheWritePrice),
      cacheReadPrice: Number(m.cacheReadPrice),
      cacheStoragePrice: Number(m.cacheStoragePrice ?? 0),
      priceUnit: m.priceUnit,
      currency: m.currency,
      hasTieredPricing: m.hasTieredPricing ?? false,
      supportedInferenceModes: m.supportedInferenceModes ?? 'online',
      status: m.status,
      sortOrder: m.sortOrder,
      description: m.description,
      priceTiers: m.priceTiers?.map((t: any) => ({
        id: t.id,
        inferenceMode: t.inferenceMode,
        inputLengthMin: t.inputLengthMin,
        inputLengthMax: t.inputLengthMax,
        outputLengthMin: t.outputLengthMin,
        outputLengthMax: t.outputLengthMax,
        inputPrice: Number(t.inputPrice),
        outputPrice: Number(t.outputPrice),
        cacheStoragePrice: Number(t.cacheStoragePrice),
        cacheReadPrice: Number(t.cacheReadPrice),
        sortOrder: t.sortOrder,
      })) ?? [],
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }
}
