import { Body, Controller, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { SubscriptionService } from './subscription.service';
import { ChangePlanDto, UpdatePlanStatusDto } from './dto/subscription.dto';

@ApiTags('订阅管理')
@Controller('lumax/v1/subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get('current')
  @ApiOperation({ summary: '当前订阅信息' })
  async getCurrent(@CurrentUser() user: UserContext) {
    return this.service.getCurrent(user.tenantId);
  }

  @Get('plans')
  @ApiOperation({ summary: '可用套餐列表' })
  async getPlans() {
    return this.service.getPlans();
  }

  @Post('change-plan')
  @ApiOperation({ summary: '变更套餐' })
  async changePlan(@CurrentUser() user: UserContext, @Body() dto: ChangePlanDto) {
    return this.service.changePlan(user.tenantId, dto);
  }

  @Put('plans/:planId/status')
  @ApiOperation({ summary: '启用/禁用套餐' })
  async updatePlanStatus(@Param('planId', ParseIntPipe) planId: number, @Body() dto: UpdatePlanStatusDto) {
    return this.service.updatePlanStatus(planId, dto.status);
  }
}
