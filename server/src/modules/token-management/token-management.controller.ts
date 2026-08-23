import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { TokenManagementService } from './token-management.service';
import { ConsumptionListDto, QuotaOperationDto, TokenUserListDto } from './dto/token-management.dto';

@ApiTags('Token 用户管理')
@Controller('lumax/v1/token')
export class TokenManagementController {
  constructor(private readonly service: TokenManagementService) {}

  @Get('model-stats')
  @ApiOperation({ summary: '各模型 Token 总消耗' })
  async getModelStats(@CurrentUser() user: UserContext) {
    return this.service.getModelStats(user.tenantId);
  }

  @Post('users')
  @ApiOperation({ summary: '分页用户 Token 列表' })
  async getUserTokenList(@CurrentUser() user: UserContext, @Body() dto: TokenUserListDto) {
    return this.service.getUserTokenList(user.tenantId, dto);
  }

  @Put('users/:userId/quota')
  @ApiOperation({ summary: '管理用户配额' })
  async updateQuota(
    @CurrentUser() user: UserContext,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: QuotaOperationDto,
  ) {
    return this.service.updateQuota(user.tenantId, userId, dto, user);
  }

  @Get('users/:userId/quota-records')
  @ApiOperation({ summary: '配额操作记录' })
  async getQuotaRecords(@CurrentUser() user: UserContext, @Param('userId', ParseIntPipe) userId: number) {
    return this.service.getQuotaRecords(user.tenantId, userId);
  }

  @Post('users/:userId/consumption')
  @ApiOperation({ summary: '用户消耗明细' })
  async getConsumptionList(
    @CurrentUser() user: UserContext,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ConsumptionListDto,
  ) {
    return this.service.getConsumptionList(user.tenantId, userId, dto);
  }
}
