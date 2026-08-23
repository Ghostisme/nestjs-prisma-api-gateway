import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UsageSettlementMessageDto {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  messageId: string;

  @ApiProperty({ description: 'Message role: user or assistant' })
  @IsString()
  role: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Message index in current run' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  messageIndex: number;

  @ApiProperty({ description: 'Message creation time', required: false })
  @IsDateString()
  @IsOptional()
  createdAt?: string;
}

export class UsageReportDto {
  @ApiProperty({ description: '幂等键', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @ApiProperty({ description: '租户ID' }) @Type(() => Number) @IsInt() tenantId: number;
  @ApiProperty({ description: '用户ID' }) @Type(() => Number) @IsInt() userId: number;
  @ApiProperty({ description: '会话线程ID' }) @IsString() threadId: string;
  @ApiProperty({ description: '运行ID', required: false }) @IsString() @IsOptional() runId?: string;
  @ApiProperty({ description: '模型名称' }) @IsString() modelName: string;
  @ApiProperty({ description: '智能体名称', required: false }) @IsString() @IsOptional() agentName?: string;
  @ApiProperty({ description: '技能名称', required: false }) @IsString() @IsOptional() skillName?: string;
  @ApiProperty({ description: '输入Token数' }) @Type(() => Number) @IsInt() tokensIn: number;
  @ApiProperty({ description: '输出Token数' }) @Type(() => Number) @IsInt() tokensOut: number;
  @ApiProperty({ description: '总Token数（部分供应商不拆分输入输出时使用）', required: false }) @Type(() => Number) @IsInt() @IsOptional() tokensTotal?: number;
  @ApiProperty({ description: '缓存命中Token数', required: false }) @Type(() => Number) @IsInt() @IsOptional() cacheReadTokens?: number;
  @ApiProperty({ description: '缓存写入Token数', required: false }) @Type(() => Number) @IsInt() @IsOptional() cacheWriteTokens?: number;
  @ApiProperty({ description: '推理Token数（R1类模型思考token）', required: false }) @Type(() => Number) @IsInt() @IsOptional() reasoningTokens?: number;
  @ApiProperty({ description: '推理模式（online/online_low_latency/batch）', required: false }) @IsString() @IsOptional() inferenceMode?: string;
  @ApiProperty({ description: '工具调用次数', required: false }) @Type(() => Number) @IsInt() @IsOptional() toolCallsCount?: number;
  @ApiProperty({ description: '响应耗时（毫秒）', required: false }) @Type(() => Number) @IsInt() @IsOptional() responseTimeMs?: number;
  @ApiProperty({ description: '对话ID', required: false }) @Type(() => Number) @IsInt() @IsOptional() conversationId?: number;
  @ApiProperty({ description: '对话状态（completed/failed/cancelled）', required: false }) @IsString() @IsOptional() status?: string;

  @ApiProperty({ description: '消息列表', required: false, type: [UsageSettlementMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UsageSettlementMessageDto)
  @IsOptional()
  messages?: UsageSettlementMessageDto[];
}

export class UsageQueryDto {
  @ApiProperty({ description: 'Tenant ID' })
  @Type(() => Number)
  @IsInt()
  tenantId: number;

  @ApiProperty({ description: 'Start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ description: 'User ID', required: false })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiProperty({ description: 'Model name', required: false })
  @IsString()
  @IsOptional()
  modelName?: string;
}
