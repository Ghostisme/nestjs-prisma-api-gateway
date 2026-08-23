import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { UserService } from './user.service';

@ApiTags('用户')
@Controller('lumax/v1/user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('permissions')
  @ApiOperation({ summary: '获取当前用户权限列表 (mock)' })
  async getPermissions(@CurrentUser() user: UserContext) {
    return this.service.getMockPermissions(user);
  }

  @Get('quota-remaining')
  @ApiOperation({ summary: '当前用户剩余配额' })
  async getQuotaRemaining(@CurrentUser() user: UserContext) {
    return this.service.getQuotaRemaining(user.tenantId, user.userId);
  }
}
