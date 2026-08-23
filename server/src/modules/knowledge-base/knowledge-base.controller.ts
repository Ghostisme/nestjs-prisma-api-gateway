import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CreateKnowledgeBaseDto, KnowledgeBaseListDto, UpdateKnowledgeBaseDto, UpdateStatusDto } from './dto/knowledge-base.dto';

@ApiTags('AI 知识库')
@Controller('lumax/v1/knowledge-bases')
export class KnowledgeBaseController {
  constructor(private readonly service: KnowledgeBaseService) {}

  @Post('list')
  @ApiOperation({ summary: '分页知识库列表' })
  async list(@CurrentUser() user: UserContext, @Body() dto: KnowledgeBaseListDto) { return this.service.list(user.tenantId, dto); }

  @Get(':id')
  @ApiOperation({ summary: '知识库详情' })
  async getById(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) { return this.service.getById(user.tenantId, id); }

  @Post()
  @ApiOperation({ summary: '创建知识库' })
  async create(@CurrentUser() user: UserContext, @Body() dto: CreateKnowledgeBaseDto) { return this.service.create(user.tenantId, dto); }

  @Put(':id')
  @ApiOperation({ summary: '更新知识库' })
  async update(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateKnowledgeBaseDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '启用/禁用知识库' })
  async updateStatus(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(user.tenantId, id, dto.status);
  }
}
