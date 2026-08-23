import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { AgentMonitorService } from './agent-monitor.service';
import { AgentRunEventDto, AgentMonitorQueryDto } from './dto/agent-monitor.dto';

@ApiTags('Agent 执行监控')
@Controller('lumax/v1/agent-monitor')
export class AgentMonitorController {
  constructor(private readonly service: AgentMonitorService) {}

  @Post('events')
  @Public()
  @ApiOperation({ summary: '上报 Agent 执行事件（DeerFlow 内部调用）' })
  async handleEvent(@Body() dto: AgentRunEventDto) {
    return this.service.handleEvent(dto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: '监控仪表盘数据' })
  async getDashboard(
    @CurrentUser() user: UserContext,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getDashboard(user.tenantId, startDate, endDate);
  }

  @Get('runs')
  @ApiOperation({ summary: '执行记录列表' })
  async getRuns(@CurrentUser() user: UserContext, @Query() query: AgentMonitorQueryDto) {
    return this.service.getRuns(user.tenantId, query);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: '执行记录详情' })
  async getRunDetail(@CurrentUser() user: UserContext, @Param('id', ParseIntPipe) id: number) {
    return this.service.getRunDetail(user.tenantId, id);
  }

  @Get('skills-ranking')
  @ApiOperation({ summary: 'Skills 使用排行' })
  async getSkillsRanking(
    @CurrentUser() user: UserContext,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getSkillsRanking(user.tenantId, startDate, endDate);
  }

  @Get('tools-stats')
  @ApiOperation({ summary: 'MCP 工具调用统计' })
  async getToolsStats(@CurrentUser() user: UserContext) {
    return this.service.getToolsStats(user.tenantId);
  }
}
