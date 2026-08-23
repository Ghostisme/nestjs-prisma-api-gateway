import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { LlmModelService } from './llm-model.service';
import { CreateLlmModelDto, LlmModelListDto, UpdateLlmModelDto, UpdateLlmModelStatusDto } from './dto/llm-model.dto';

@ApiTags('LLM 模型管理')
@Controller('lumax/v1/llm-models')
export class LlmModelController {
  constructor(private readonly service: LlmModelService) {}

  @Post('list')
  @ApiOperation({ summary: '分页查询 LLM 模型列表' })
  async list(@CurrentUser() user: UserContext, @Body() dto: LlmModelListDto) {
    return this.service.list(user.tenantId, dto);
  }

  @Get('providers')
  @ApiOperation({ summary: '获取所有供应商列表' })
  async getProviders(@CurrentUser() user: UserContext) {
    return this.service.getProviders(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'LLM 模型详情' })
  async getById(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) {
    return this.service.getById(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: '创建 LLM 模型' })
  async create(@CurrentUser() user: UserContext, @Body() dto: CreateLlmModelDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新 LLM 模型' })
  async update(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLlmModelDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '启用/禁用 LLM 模型' })
  async updateStatus(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLlmModelStatusDto) {
    return this.service.updateStatus(user.tenantId, id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 LLM 模型' })
  async delete(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) {
    return this.service.delete(user.tenantId, id);
  }
}
