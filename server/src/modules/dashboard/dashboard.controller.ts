import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@ApiTags('AI 监控看板')
@Controller('lumax/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post('user')
  @ApiOperation({ summary: '用户数据看板', description: '统计对话量、用户数、满意度等指标及日环比' })
  async getUserDashboard(@CurrentUser() user: UserContext, @Body() filter: DashboardFilterDto) {
    return this.dashboardService.getUserDashboard(user.tenantId, filter);
  }

  @Post('token')
  @ApiOperation({ summary: 'Token 用量看板', description: '统计 Token 消耗总量、用户 TOP10、Agent 消耗分布' })
  async getTokenDashboard(@CurrentUser() user: UserContext, @Body() filter: DashboardFilterDto) {
    return this.dashboardService.getTokenDashboard(user.tenantId, filter);
  }

  @Post('feedback')
  @ApiOperation({ summary: '用户反馈看板', description: '统计好评/差评率、反馈分布、反馈记录' })
  async getFeedbackDashboard(@CurrentUser() user: UserContext, @Body() filter: DashboardFilterDto) {
    return this.dashboardService.getFeedbackDashboard(user.tenantId, filter);
  }

  @Get('filter-options')
  @ApiOperation({ summary: '获取看板筛选项', description: '返回可用的 Model/Agent 下拉列表' })
  async getFilterOptions(@CurrentUser() user: UserContext) {
    return this.dashboardService.getFilterOptions(user.tenantId);
  }
}
