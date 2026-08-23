import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { BannedWordsService } from './banned-words.service';
import { BannedWordsFilterDto, CreateBannedWordDto, ToggleBannedWordDto } from './dto/banned-words.dto';

@ApiTags('AI 违禁词管理')
@Controller('lumax/v1/banned-words')
export class BannedWordsController {
  constructor(private readonly service: BannedWordsService) {}

  @Post('overview')
  @ApiOperation({ summary: '违禁词总览统计' })
  async getOverview(@CurrentUser() user: UserContext, @Body() filter: BannedWordsFilterDto) {
    return this.service.getOverview(user.tenantId, filter);
  }

  @Post('category-distribution')
  @ApiOperation({ summary: '类型分布' })
  async getCategoryDistribution(@CurrentUser() user: UserContext, @Body() filter: BannedWordsFilterDto) {
    return this.service.getCategoryDistribution(user.tenantId, filter);
  }

  @Post('user-rank')
  @ApiOperation({ summary: '用户触发排行' })
  async getUserRank(@CurrentUser() user: UserContext, @Body() filter: BannedWordsFilterDto) {
    return this.service.getUserRank(user.tenantId, filter);
  }

  @Get('categories')
  @ApiOperation({ summary: '违禁词类型列表' })
  async getCategories(@CurrentUser() user: UserContext) { return this.service.getCategories(user.tenantId); }

  @Post()
  @ApiOperation({ summary: '新增违禁词' })
  async create(@CurrentUser() user: UserContext, @Body() dto: CreateBannedWordDto) { return this.service.createBannedWord(user.tenantId, dto); }

  @Put(':wordId/toggle')
  @ApiOperation({ summary: '启用/禁用违禁词' })
  async toggle(
    @CurrentUser() user: UserContext,
    @Param('wordId', ParseIntPipe) wordId: number,
    @Body() dto: ToggleBannedWordDto,
  ) { return this.service.toggleWord(user.tenantId, wordId, dto.status); }

  @Delete(':wordId')
  @ApiOperation({ summary: '删除违禁词' })
  async remove(@CurrentUser() user: UserContext, @Param('wordId', ParseIntPipe) wordId: number) {
    return this.service.deleteWord(user.tenantId, wordId);
  }

  @Get('categories/:categoryId/words')
  @ApiOperation({ summary: '类型下的词条列表' })
  async getCategoryWords(@CurrentUser() user: UserContext, @Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.service.getCategoryWords(user.tenantId, categoryId);
  }

  @Get('categories/:categoryId/triggers')
  @ApiOperation({ summary: '类型下所有触发记录' })
  async getCategoryTriggers(@CurrentUser() user: UserContext, @Param('categoryId', ParseIntPipe) categoryId: number) {
    return this.service.getCategoryTriggers(user.tenantId, categoryId);
  }

  @Get(':wordId/triggers')
  @ApiOperation({ summary: '违禁词触发记录' })
  async getWordTriggers(@CurrentUser() user: UserContext, @Param('wordId', ParseIntPipe) wordId: number) {
    return this.service.getWordTriggers(user.tenantId, wordId);
  }
}
