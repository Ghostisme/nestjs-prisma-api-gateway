import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { verifyInternalSignature } from '../../common/security/internal-signature.util';
import {
  BannedWordHitDto,
  CheckBannedWordsDto,
  CheckQuotaDto,
  ConversationEndDto,
  ConversationStartDto,
  FeedbackDto,
} from './dto/collector.dto';
import { CollectorService } from './collector.service';

@ApiTags('Internal Collector')
@Controller('lumax/v1')
export class CollectorController {
  constructor(private readonly service: CollectorService) {}

  @Post('collector/conversation-start')
  @Public()
  @ApiOperation({ summary: 'Conversation started callback' })
  async conversationStart(@Body() dto: ConversationStartDto) {
    return this.service.conversationStart(dto);
  }

  @Post('collector/conversation-end')
  @Public()
  @ApiOperation({ summary: 'Conversation completed callback' })
  async conversationEnd(@Body() dto: ConversationEndDto) {
    return this.service.conversationEnd(dto);
  }

  @Post('collector/feedback')
  @Public()
  @ApiOperation({ summary: 'User feedback callback' })
  async feedback(@Body() dto: FeedbackDto) {
    return this.service.feedback(dto);
  }

  @Post('collector/banned-word-hit')
  @Public()
  @ApiOperation({ summary: 'Banned word hit callback' })
  async bannedWordHit(@Body() dto: BannedWordHitDto) {
    return this.service.bannedWordHit(dto);
  }

  @Post('internal/check-quota')
  @Public()
  @ApiOperation({ summary: 'Check user quota' })
  async checkQuota(@Body() dto: CheckQuotaDto, @Req() req: Request) {
    verifyInternalSignature(req.headers, dto);
    return this.service.checkQuota(dto);
  }

  @Post('internal/check-banned-words')
  @Public()
  @ApiOperation({ summary: 'Check banned words' })
  async checkBannedWords(@Body() dto: CheckBannedWordsDto) {
    return this.service.checkBannedWords(dto);
  }
}
