import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { verifyInternalSignature } from '../../common/security/internal-signature.util';
import { UsageReportDto, UsageQueryDto } from './dto/usage-metering.dto';
import { UsageMeteringService } from './usage-metering.service';

@ApiTags('Usage Metering')
@Controller('lumax/v1/usage')
export class UsageMeteringController {
  constructor(private readonly service: UsageMeteringService) {}

  @Post('report')
  @Public()
  @ApiOperation({ summary: 'Report token usage from DeerFlow' })
  async report(@Body() dto: UsageReportDto, @Req() req: Request) {
    verifyInternalSignature(req.headers, dto);
    return this.service.report(dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Current usage summary' })
  async getSummary(@CurrentUser() user: UserContext, @Query() query: UsageQueryDto) {
    query.tenantId = user.tenantId;
    return this.service.getSummary(query);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Usage trends' })
  async getTrends(@CurrentUser() user: UserContext, @Query() query: UsageQueryDto) {
    query.tenantId = user.tenantId;
    return this.service.getTrends(query);
  }

  @Get('by-model')
  @ApiOperation({ summary: 'Usage by model' })
  async getByModel(@CurrentUser() user: UserContext, @Query() query: UsageQueryDto) {
    query.tenantId = user.tenantId;
    return this.service.getByModel(query);
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Usage by user' })
  async getByUser(@CurrentUser() user: UserContext, @Query() query: UsageQueryDto) {
    query.tenantId = user.tenantId;
    return this.service.getByUser(query);
  }

  @Get('quota-status')
  @ApiOperation({ summary: 'Quota status' })
  async getQuotaStatus(@CurrentUser() user: UserContext) {
    return this.service.getQuotaStatus(user.tenantId);
  }
}
