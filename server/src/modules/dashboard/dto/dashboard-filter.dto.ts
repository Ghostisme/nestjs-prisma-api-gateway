import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray } from 'class-validator';

export class DashboardFilterDto {
  @ApiProperty({ description: '模型筛选', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ description: '智能体筛选', required: false })
  @IsString()
  @IsOptional()
  agent?: string;

  @ApiProperty({
    description: '时间范围（all/yesterday/last7days/last30days/custom）',
    default: 'all',
    required: false,
  })
  @IsString()
  @IsOptional()
  timeRange?: string = 'all';

  @ApiProperty({ description: '自定义时间范围 [开始日期, 结束日期]', required: false })
  @IsArray()
  @IsOptional()
  customRange?: string[];
}
