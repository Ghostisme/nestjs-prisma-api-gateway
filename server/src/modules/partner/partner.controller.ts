import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { PartnerService } from './partner.service';
import { CreatePartnerDto, PartnerListDto, UpdatePartnerDto } from './dto/partner.dto';

@ApiTags('合作企业管理')
@Controller('lumax/v1/partners')
export class PartnerController {
  constructor(private readonly service: PartnerService) {}

  @Post('page')
  @ApiOperation({ summary: '合作企业分页列表' })
  async page(@CurrentUser() user: UserContext, @Body() dto: PartnerListDto) { return this.service.page(user.tenantId, dto); }

  @Get('brands')
  @ApiOperation({ summary: '品牌选项' })
  async getBrands(@CurrentUser() user: UserContext) { return this.service.getBrands(user.tenantId); }

  @Get(':id')
  @ApiOperation({ summary: '合作企业详情' })
  async getDetail(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) { return this.service.getDetail(user.tenantId, id); }

  @Post()
  @ApiOperation({ summary: '创建合作企业' })
  async create(@CurrentUser() user: UserContext, @Body() dto: CreatePartnerDto) { return this.service.create(user.tenantId, dto); }

  @Put(':id')
  @ApiOperation({ summary: '更新合作企业' })
  async update(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePartnerDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Put(':id/enable')
  @ApiOperation({ summary: '启用合作企业' })
  async enable(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) { return this.service.enable(user.tenantId, id); }

  @Put(':id/disable')
  @ApiOperation({ summary: '禁用合作企业' })
  async disable(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) { return this.service.disable(user.tenantId, id); }

  @Delete(':id')
  @ApiOperation({ summary: '删除合作企业' })
  async remove(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) { return this.service.remove(user.tenantId, id); }
}
