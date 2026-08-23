import { Body, Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { OrgService } from './org.service';
import { TokenConfigDto } from './dto/org.dto';

@ApiTags('Token 系统管理 (组织)')
@Controller('lumax/v1/org')
export class OrgController {
  constructor(private readonly service: OrgService) {}

  @Get('tree')
  @ApiOperation({ summary: '获取组织树' })
  async getTree() { return this.service.getTree(); }

  @Get('nodes/:nodeId')
  @ApiOperation({ summary: '节点详情' })
  async getNodeDetail(@CurrentUser() user: UserContext, @Param('nodeId') nodeId: string) {
    return this.service.getNodeDetail(user.tenantId, nodeId);
  }

  @Put('nodes/:nodeId/token-config')
  @ApiOperation({ summary: '配置部门 Token 策略' })
  async setDeptTokenConfig(
    @CurrentUser() user: UserContext,
    @Param('nodeId', ParseIntPipe) nodeId: number,
    @Body() dto: TokenConfigDto,
  ) { return this.service.setDeptTokenConfig(user.tenantId, nodeId, dto); }

  @Put('members/:memberId/token-config')
  @ApiOperation({ summary: '配置成员 Token 策略' })
  async setMemberTokenConfig(
    @CurrentUser() user: UserContext,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: TokenConfigDto,
  ) { return this.service.setMemberTokenConfig(user.tenantId, memberId, dto); }
}
