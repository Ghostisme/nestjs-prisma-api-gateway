import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/filters/business-exception.filter';
import { ErrorCode } from '../../common/enums/error-code.enum';
import type { KnowledgeBaseListDto, CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto/knowledge-base.dto';

@Injectable()
export class KnowledgeBaseService {
  constructor(private readonly prisma: PrismaService) {}

  private mapStatus(status: string): string {
    return status === 'enabled' ? 'active' : status;
  }

  private mapTags(tags: string[]): { tagId: string; tagName: string }[] {
    return (tags ?? []).map((t) => ({ tagId: t, tagName: t }));
  }

  async list(tenantId: number, dto: KnowledgeBaseListDto) {
    const { current = 1, size = 10 } = dto;
    const where: any = { tenantId };
    if (dto.name) where.name = { contains: dto.name, mode: 'insensitive' };
    if (dto.status) where.status = this.reverseMapStatus(dto.status);
    if (dto.tag) where.tags = { has: dto.tag };

    const [rows, total, overview] = await Promise.all([
      this.prisma.lumaxKnowledgeBase.findMany({
        where,
        skip: (current - 1) * size,
        take: size,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.lumaxKnowledgeBase.count({ where }),
      this.prisma.lumaxKnowledgeBase.aggregate({
        where: { tenantId },
        _count: true,
        _sum: { documentCount: true, referenceCount: true },
      }),
    ]);

    return {
      overview: {
        totalBases: overview._count,
        totalDocuments: overview._sum.documentCount ?? 0,
        totalReferences: overview._sum.referenceCount ?? 0,
      },
      items: rows.map((item) => ({
        id: String(item.id),
        name: item.name,
        description: item.description,
        tags: this.mapTags(item.tags as string[]),
        documentCount: item.documentCount,
        referenceCount: item.referenceCount,
        status: this.mapStatus(item.status),
        updatedAt: item.updatedAt,
      })),
      total,
    };
  }

  async getById(tenantId: number, id: number) {
    const kb = await this.prisma.lumaxKnowledgeBase.findFirst({
      where: { id, tenantId },
      include: { documents: { orderBy: { uploadedAt: 'desc' } } },
    });
    if (!kb) throw new BusinessException(ErrorCode.KNOWLEDGE_BASE_NOT_FOUND);

    return {
      id: String(kb.id),
      name: kb.name,
      description: kb.description,
      tags: this.mapTags(kb.tags as string[]),
      documents: (kb as any).documents?.map((doc: any) => ({
        docId: String(doc.id),
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        uploadTime: doc.uploadedAt,
        status: doc.status,
      })) ?? [],
      documentCount: kb.documentCount,
      referenceCount: kb.referenceCount,
      status: this.mapStatus(kb.status),
      createdAt: kb.createdAt,
      updatedAt: kb.updatedAt,
    };
  }

  async create(tenantId: number, dto: CreateKnowledgeBaseDto) {
    return this.prisma.lumaxKnowledgeBase.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        tags: dto.tags ?? [],
      },
    });
  }

  async update(tenantId: number, id: number, dto: UpdateKnowledgeBaseDto) {
    const kb = await this.prisma.lumaxKnowledgeBase.findFirst({ where: { id, tenantId } });
    if (!kb) throw new BusinessException(ErrorCode.KNOWLEDGE_BASE_NOT_FOUND);

    return this.prisma.lumaxKnowledgeBase.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    });
  }

  private reverseMapStatus(status: string): string {
    return status === 'active' ? 'enabled' : status;
  }

  async updateStatus(tenantId: number, id: number, status: string) {
    const kb = await this.prisma.lumaxKnowledgeBase.findFirst({ where: { id, tenantId } });
    if (!kb) throw new BusinessException(ErrorCode.KNOWLEDGE_BASE_NOT_FOUND);

    return this.prisma.lumaxKnowledgeBase.update({
      where: { id },
      data: { status: this.reverseMapStatus(status) },
    });
  }

  async addDocument(tenantId: number, knowledgeBaseId: number, fileName: string, fileSize: number, fileType: string, fileUrl: string) {
    const kb = await this.prisma.lumaxKnowledgeBase.findFirst({ where: { id: knowledgeBaseId, tenantId } });
    if (!kb) throw new BusinessException(ErrorCode.KNOWLEDGE_BASE_NOT_FOUND);

    const doc = await this.prisma.lumaxKnowledgeBaseDocument.create({
      data: { tenantId, knowledgeBaseId, fileName, fileSize, fileType, fileUrl, status: 'processing' },
    });

    await this.prisma.lumaxKnowledgeBase.update({
      where: { id: knowledgeBaseId },
      data: { documentCount: { increment: 1 } },
    });

    return doc;
  }
}
