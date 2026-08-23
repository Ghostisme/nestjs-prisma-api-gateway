import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConversationStartDto {
  @ApiProperty({ description: 'Tenant ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ description: 'Conversation thread ID' })
  @IsString()
  threadId: string;

  @ApiProperty({ description: 'User ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ description: 'Username', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ description: 'Model name', required: false })
  @IsString()
  @IsOptional()
  modelName?: string;

  @ApiProperty({ description: 'Agent name', required: false })
  @IsString()
  @IsOptional()
  agentName?: string;
}

export class ConversationEndDto {
  @ApiProperty({ description: '租户ID' }) @Type(() => Number) @IsInt() tenantId: number;
  @ApiProperty({ description: '会话线程ID' }) @IsString() threadId: string;
  @ApiProperty({ description: '对话标题', required: false }) @IsString() @IsOptional() title?: string;
  @ApiProperty({ description: '消息数量', required: false }) @Type(() => Number) @IsInt() @IsOptional() messageCount?: number;
  @ApiProperty({ description: '输入Token数', required: false }) @Type(() => Number) @IsInt() @IsOptional() inputTokens?: number;
  @ApiProperty({ description: '输出Token数', required: false }) @Type(() => Number) @IsInt() @IsOptional() outputTokens?: number;
  @ApiProperty({ description: '总Token数', required: false }) @Type(() => Number) @IsInt() @IsOptional() totalTokens?: number;
  @ApiProperty({ description: '缓存命中Token数', required: false }) @Type(() => Number) @IsInt() @IsOptional() cacheReadTokens?: number;
  @ApiProperty({ description: '推理Token数', required: false }) @Type(() => Number) @IsInt() @IsOptional() reasoningTokens?: number;
  @ApiProperty({ description: '持续时长（秒）', required: false }) @Type(() => Number) @IsInt() @IsOptional() durationSeconds?: number;
}

export class FeedbackDto {
  @ApiProperty({ description: 'Tenant ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ description: 'Conversation thread ID' })
  @IsString()
  threadId: string;

  @ApiProperty({ description: 'Message ID' })
  @IsString()
  messageId: string;

  @ApiProperty({ description: 'Run ID', required: false })
  @IsString()
  @IsOptional()
  runId?: string;

  @ApiProperty({ description: 'User ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ description: 'Message index', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  messageIndex?: number;

  @ApiProperty({ description: 'Feedback result: positive or negative' })
  @IsString()
  result: string;

  @ApiProperty({ description: 'User question', required: false })
  @IsString()
  @IsOptional()
  userQuestion?: string;

  @ApiProperty({ description: 'Assistant answer', required: false })
  @IsString()
  @IsOptional()
  assistantAnswer?: string;

  @ApiProperty({ description: 'Agent name', required: false })
  @IsString()
  @IsOptional()
  agentName?: string;

  @ApiProperty({ description: 'Feedback comment', required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class BannedWordHitDto {
  @ApiProperty({ description: 'Tenant ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ description: 'Banned word ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wordId: number;

  @ApiProperty({ description: 'Banned word category ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiProperty({ description: 'Conversation ID', required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  conversationId?: number;

  @ApiProperty({ description: 'User ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ description: 'Matched word', required: false })
  @IsString()
  @IsOptional()
  matchedWord?: string;

  @ApiProperty({ description: 'Matched sentence', required: false })
  @IsString()
  @IsOptional()
  matchedSentence?: string;

  @ApiProperty({ description: 'Trigger source: input or output', required: false })
  @IsString()
  @IsOptional()
  triggerSource?: string;

  @ApiProperty({ description: 'Matched mode: exact/fuzzy/semantic/model', required: false })
  @IsString()
  @IsOptional()
  matchedMode?: string;
}

export class CheckQuotaDto {
  @ApiProperty({ description: 'Tenant ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ description: 'User ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;
}

export class CheckBannedWordsDto {
  @ApiProperty({ description: 'Tenant ID' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tenantId: number;

  @ApiProperty({ description: 'Text to check' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Trigger mode: input or output' })
  @IsString()
  triggerMode: string;
}
