import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { PageResult } from '../../common/dto/response.dto';
import { fmtDate } from '../../common/utils/format.util';
import type { PartnerListDto, CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';

@Injectable()
export class PartnerService {
  constructor(private readonly prisma: PrismaService) {}

  async page(tenantId: number, dto: PartnerListDto) {
    const { current = 1, size = 10 } = dto;
    const where: any = { tenantId, delFlag: 0 };
    if (dto.brandName) where.brandName = { contains: dto.brandName };
    if (dto.partnerName) where.partnerName = { contains: dto.partnerName };
    if (dto.status !== undefined) where.status = dto.status;

    const [rows, total] = await Promise.all([
      this.prisma.lumaxPartnerEnterprise.findMany({
        where,
        skip: (current - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lumaxPartnerEnterprise.count({ where }),
    ]);

    const records = rows.map((r) => ({
      partnerId: r.id,
      brandName: r.brandName,
      partnerName: r.partnerName,
      userCount: r.userCount,
      status: r.status,
      joinTime: fmtDate(r.createdAt),
    }));

    return PageResult.of(records, total, current, size);
  }

  async getBrands(tenantId: number) {
    const brands = await this.prisma.lumaxBrand.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return brands.map((b) => ({
      brandId: String(b.id),
      brandName: b.name,
    }));
  }

  async getDetail(tenantId: number, id: number) {
    const partner = await this.prisma.lumaxPartnerEnterprise.findFirst({
      where: { id, tenantId },
    });
    if (!partner || partner.delFlag === 1) throw new BusinessException(ErrorCode.PARTNER_NOT_FOUND);

    return {
      partnerId: partner.id,
      brandId: String(partner.brandId ?? ''),
      brandName: partner.brandName,
      partnerName: partner.partnerName,
      contactPerson: partner.contactPerson,
      contactPhone: partner.contactPhone,
      backendModules: partner.backendModules as string[],
      aiFunctions: partner.aiFunctions as string[],
      userCount: partner.userCount,
      status: partner.status,
      joinTime: fmtDate(partner.createdAt),
    };
  }

  async create(tenantId: number, dto: CreatePartnerDto) {
    const brandId = Number(dto.brandId);
    const brand = await this.prisma.lumaxBrand.findFirst({ where: { id: brandId, tenantId } });

    const existing = await this.prisma.lumaxPartnerEnterprise.findFirst({
      where: { tenantId, partnerName: dto.partnerName, delFlag: 0 },
    });
    if (existing) throw new BusinessException(ErrorCode.PARTNER_NAME_EXISTS);

    return this.prisma.lumaxPartnerEnterprise.create({
      data: {
        tenantId,
        brandId,
        brandName: brand?.name ?? '',
        partnerName: dto.partnerName,
        contactPerson: dto.contactPerson ?? '',
        contactPhone: dto.contactPhone ?? '',
        backendModules: dto.backendModules ?? [],
        aiFunctions: dto.aiFunctions ?? [],
        status: dto.status ?? 0,
      },
    });
  }

  async update(tenantId: number, id: number, dto: UpdatePartnerDto) {
    const partner = await this.prisma.lumaxPartnerEnterprise.findFirst({ where: { id, tenantId } });
    if (!partner || partner.delFlag === 1) throw new BusinessException(ErrorCode.PARTNER_NOT_FOUND);

    const brandId = Number(dto.brandId);
    const brand = await this.prisma.lumaxBrand.findFirst({ where: { id: brandId, tenantId } });

    return this.prisma.lumaxPartnerEnterprise.update({
      where: { id },
      data: {
        brandId,
        brandName: brand?.name ?? partner.brandName,
        partnerName: dto.partnerName,
        contactPerson: dto.contactPerson ?? partner.contactPerson,
        contactPhone: dto.contactPhone ?? partner.contactPhone,
        backendModules: dto.backendModules ?? (partner.backendModules as string[]),
        aiFunctions: dto.aiFunctions ?? (partner.aiFunctions as string[]),
        status: dto.status ?? partner.status,
      },
    });
  }

  async enable(tenantId: number, id: number) {
    await this.ensureExists(tenantId, id);
    return this.prisma.lumaxPartnerEnterprise.update({ where: { id }, data: { status: 0 } });
  }

  async disable(tenantId: number, id: number) {
    await this.ensureExists(tenantId, id);
    return this.prisma.lumaxPartnerEnterprise.update({ where: { id }, data: { status: 1 } });
  }

  async remove(tenantId: number, id: number) {
    await this.ensureExists(tenantId, id);
    return this.prisma.lumaxPartnerEnterprise.update({ where: { id }, data: { delFlag: 1 } });
  }

  private async ensureExists(tenantId: number, id: number) {
    const partner = await this.prisma.lumaxPartnerEnterprise.findFirst({ where: { id, tenantId } });
    if (!partner || partner.delFlag === 1) throw new BusinessException(ErrorCode.PARTNER_NOT_FOUND);
  }
}
