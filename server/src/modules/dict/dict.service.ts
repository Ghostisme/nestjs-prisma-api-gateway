import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';

@Injectable()
export class DictService {
  constructor(private readonly prisma: PrismaService) {}

  async getByTypeCode(tenantId: number, typeCode: string) {
    if (typeCode === 'model_list') {
      return this.getModelListFromLlmModel(tenantId);
    }

    const dictType = await this.prisma.lumaxDictType.findUnique({
      where: { tenantId_typeCode: { tenantId, typeCode } },
    });
    if (!dictType) {
      throw new BusinessException(ErrorCode.DICT_TYPE_NOT_FOUND);
    }

    const items = await this.prisma.lumaxDictItem.findMany({
      where: { tenantId, typeCode, status: 'enabled' },
      orderBy: { sortOrder: 'asc' },
    });

    const hasChildren = items.some((i) => i.parentValue != null);
    if (!hasChildren) {
      return items.map((i) => ({
        value: i.itemValue,
        label: i.itemLabel,
        extra: i.extra,
      }));
    }

    const roots = items.filter((i) => !i.parentValue);
    return roots.map((root) => ({
      value: root.itemValue,
      label: root.itemLabel,
      extra: root.extra,
      children: items
        .filter((i) => i.parentValue === root.itemValue)
        .map((c) => ({ value: c.itemValue, label: c.itemLabel, extra: c.extra })),
    }));
  }

  async getBatch(tenantId: number, typeCodes: string[]) {
    const result: Record<string, any[]> = {};
    await Promise.all(
      typeCodes.map(async (code) => {
        try {
          result[code] = await this.getByTypeCode(tenantId, code);
        } catch {
          result[code] = [];
        }
      }),
    );
    return result;
  }

  private async getModelListFromLlmModel(tenantId: number) {
    const models = await this.prisma.lumaxLlmModel.findMany({
      where: { tenantId, status: 'enabled' },
      orderBy: { sortOrder: 'asc' },
    });

    return models.map((m) => ({
      value: m.modelCode,
      label: m.modelName,
      extra: {
        provider: m.provider,
        modelType: m.modelType,
        maxContextTokens: m.maxContextTokens,
        maxOutputTokens: m.maxOutputTokens,
        inputPrice: Number(m.inputPrice),
        outputPrice: Number(m.outputPrice),
        cacheWritePrice: Number(m.cacheWritePrice),
        cacheReadPrice: Number(m.cacheReadPrice),
        priceUnit: m.priceUnit,
        currency: m.currency,
      },
    }));
  }
}
