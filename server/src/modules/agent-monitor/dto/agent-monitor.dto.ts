import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class AgentRunEventDto {
  @ApiProperty({ description: '租户ID' }) @Type(() => Number) @IsInt() tenantId: number;
  @ApiProperty({ description: '用户ID' }) @Type(() => Number) @IsInt() userId: number;
  @ApiProperty({ description: '会话线程ID' }) @IsString() threadId: string;
  @ApiProperty({ description: '事件类型（start/end）' }) @IsString() eventType: string;
  @ApiProperty({ description: '智能体名称', required: false }) @IsString() @IsOptional() agentName?: string;
  @ApiProperty({ description: '技能名称', required: false }) @IsString() @IsOptional() skillName?: string;
  @ApiProperty({ description: '模型名称', required: false }) @IsString() @IsOptional() modelName?: string;
  @ApiProperty({ description: '执行状态', required: false }) @IsString() @IsOptional() status?: string;
  @ApiProperty({ description: '执行时长（毫秒）', required: false }) @Type(() => Number) @IsInt() @IsOptional() durationMs?: number;
  @ApiProperty({ description: '总 Token', required: false }) @Type(() => Number) @IsInt() @IsOptional() tokensTotal?: number;
  @ApiProperty({ description: '输入 Token', required: false }) @Type(() => Number) @IsInt() @IsOptional() tokensIn?: number;
  @ApiProperty({ description: '输出 Token', required: false }) @Type(() => Number) @IsInt() @IsOptional() tokensOut?: number;
  @ApiProperty({ description: '工具调用次数', required: false }) @Type(() => Number) @IsInt() @IsOptional() toolCallsCount?: number;
  @ApiProperty({ description: '错误类型', required: false }) @IsString() @IsOptional() errorType?: string;
  @ApiProperty({ description: '错误信息', required: false }) @IsString() @IsOptional() errorMessage?: string;
  @ApiProperty({ description: 'Agent Run ID（end 事件时传入）', required: false }) @Type(() => Number) @IsInt() @IsOptional() runId?: number;
}

export class AgentMonitorQueryDto {
  @ApiProperty({ description: '开始日期', required: false }) @IsDateString() @IsOptional() startDate?: string;
  @ApiProperty({ description: '结束日期', required: false }) @IsDateString() @IsOptional() endDate?: string;
  @ApiProperty({ description: '状态筛选', required: false }) @IsString() @IsOptional() status?: string;
  @ApiProperty({ description: '智能体名称', required: false }) @IsString() @IsOptional() agentName?: string;
  @ApiProperty({ description: '页码', required: false }) @Type(() => Number) @IsInt() @IsOptional() page?: number;
  @ApiProperty({ description: '每页大小', required: false }) @Type(() => Number) @IsInt() @IsOptional() pageSize?: number;
}
