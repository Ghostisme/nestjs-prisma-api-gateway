import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserContext } from '../../common/interfaces/user-context.interface';
import { ConversationService } from './conversation.service';
import { ConversationUserListDto, ConversationDetailListDto } from './dto/conversation.dto';

@ApiTags('用户对话统计')
@Controller('lumax/v1/conversation')
export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  @Get('model-stats')
  @ApiOperation({ summary: '各模型对话总数' })
  async getModelStats(@CurrentUser() user: UserContext) {
    return this.service.getModelStats(user.tenantId);
  }

  @Post('users')
  @ApiOperation({ summary: '分页用户对话列表' })
  async getUserConversationList(@CurrentUser() user: UserContext, @Body() dto: ConversationUserListDto) {
    return this.service.getUserConversationList(user.tenantId, dto);
  }

  @Post('users/:userId/details')
  @ApiOperation({ summary: '用户对话明细' })
  async getUserConversationDetails(
    @CurrentUser() user: UserContext,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ConversationDetailListDto,
  ) {
    return this.service.getUserConversationDetails(user.tenantId, userId, dto);
  }

  @Get('view/:dialogId')
  @ApiOperation({ summary: '对话详情视图' })
  async getConversationView(@CurrentUser() user: UserContext, @Param('dialogId', ParseIntPipe) dialogId: number) {
    return this.service.getConversationView(user.tenantId, dialogId);
  }
}
