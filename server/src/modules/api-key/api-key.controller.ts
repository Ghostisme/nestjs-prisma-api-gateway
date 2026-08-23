import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto, ApiKeyQueryDto } from './dto/api-key.dto';

@ApiTags('API Key 管理')
@Controller('lumax/v1/api-keys')
export class ApiKeyController {
  constructor(private readonly service: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: '创建 API Key' })
  async create(@CurrentUser() user: UserContext, @Body() dto: CreateApiKeyDto) {
    return this.service.create(user.tenantId, user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'API Key 列表' })
  async list(@CurrentUser() user: UserContext, @Query() query: ApiKeyQueryDto) {
    return this.service.list(user.tenantId, user.userId, query);
  }

  @Put(':id/revoke')
  @ApiOperation({ summary: '吊销 API Key' })
  async revoke(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) {
    return this.service.revoke(user.tenantId, user.userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 API Key' })
  async remove(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(user.tenantId, user.userId, id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'API Key 用量统计' })
  async getUsage(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) {
    return this.service.getUsage(user.tenantId, id);
  }
}
