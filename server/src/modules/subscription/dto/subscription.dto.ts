import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ChangePlanDto {
  @ApiProperty({ description: '目标套餐层级（free/pro/enterprise）' }) @IsString() planTier: string;
  @ApiProperty({ description: '自定义 Token 上限', required: false }) @Type(() => Number) @IsInt() @IsOptional() tokenLimitMonthly?: number;
  @ApiProperty({ description: '自定义并发限制', required: false }) @Type(() => Number) @IsInt() @IsOptional() concurrentLimit?: number;
}

export class UpdatePlanStatusDto {
  @ApiProperty({ description: '套餐状态（enabled/disabled）' }) @IsString() status: string;
}
